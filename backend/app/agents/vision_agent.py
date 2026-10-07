import base64
import fitz  # PyMuPDF
from typing import Dict, List, Any, Tuple
import io

import os
import json
import subprocess
import uuid

OCR_HELPER_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ocr_helper"))

class VisionAgent:
    """
    Agent 1: Ingestion & Vision Agent
    - Reads raw PDF and image (PNG/JPG/WEBP) bytes
    - Automatically converts photos to multi-modal document canvas
    - Extracts reading order, blocks, lines, and exact token bounding boxes
    - Generates high-fidelity page images for canvas overlay
    - Returns structured spatial map
    """

    def process_document(self, doc_bytes: bytes) -> Dict[str, Any]:
        is_image = False
        if len(doc_bytes) >= 8:
            if doc_bytes[:8] == b"\x89PNG\r\n\x1a\n" or doc_bytes[:3] == b"\xff\xd8\xff" or (doc_bytes[:4] == b"RIFF" and doc_bytes[8:12] == b"WEBP") or doc_bytes[:4] in (b"II*\x00", b"MM\x00*"):
                is_image = True

        if is_image:
            img_doc = fitz.open(stream=doc_bytes)
            pdf_bytes = img_doc.convert_to_pdf()
            doc = fitz.open("pdf", pdf_bytes)
        else:
            try:
                doc = fitz.open(stream=doc_bytes, filetype="pdf")
            except Exception:
                img_doc = fitz.open(stream=doc_bytes)
                pdf_bytes = img_doc.convert_to_pdf()
                doc = fitz.open("pdf", pdf_bytes)
        
        pages_data = []
        all_tokens = []
        blocks_data = []
        page_images = []
        full_text_pages = []

        total_word_count = 0

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            rect = page.rect
            width, height = rect.width, rect.height

            # High-res rendering for split viewer
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            b64_img = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
            page_images.append(b64_img)

            # Extract text blocks & layout
            # get_text("blocks") returns (x0, y0, x1, y1, text, block_no, block_type)
            raw_blocks = page.get_text("blocks")
            page_blocks = []
            for b in raw_blocks:
                if b[6] == 0:  # text block
                    page_blocks.append({
                        "page": page_idx,
                        "x0": round(b[0], 2),
                        "y0": round(b[1], 2),
                        "x1": round(b[2], 2),
                        "y1": round(b[3], 2),
                        "text": b[4].strip(),
                        "block_num": b[5]
                    })
            blocks_data.extend(page_blocks)

            # Extract individual words with exact bounding boxes
            # get_text("words") returns (x0, y0, x1, y1, word, block_no, line_no, word_no)
            words = page.get_text("words")
            page_tokens = []
            
            # If it's a scanned photo without an embedded digital font layer, run native OCR
            if len(words) == 0 and os.path.exists(OCR_HELPER_PATH):
                temp_path = f"/tmp/vision_ocr_{uuid.uuid4().hex[:8]}.png"
                try:
                    with open(temp_path, "wb") as f:
                        f.write(img_bytes)
                    ocr_res = subprocess.run([OCR_HELPER_PATH, temp_path], capture_output=True, text=True, timeout=10)
                    if ocr_res.returncode == 0 and ocr_res.stdout.strip():
                        observations = json.loads(ocr_res.stdout)
                        # Scale factor between render image and PDF canvas
                        sx = width / float(pix.width) if pix.width else 1.0
                        sy = height / float(pix.height) if pix.height else 1.0
                        for idx, obs in enumerate(observations):
                            bx = obs.get("bbox", [0, 0, 0, 0])
                            words_in_line = obs.get("text", "").split()
                            for w_idx, w_text in enumerate(words_in_line):
                                t_item = {
                                    "page": page_idx,
                                    "x0": round(bx[0] * sx, 2),
                                    "y0": round(bx[1] * sy, 2),
                                    "x1": round(bx[2] * sx, 2),
                                    "y1": round(bx[3] * sy, 2),
                                    "text": w_text,
                                    "block_num": idx,
                                    "line_num": 0,
                                    "word_num": w_idx,
                                }
                                page_tokens.append(t_item)
                                all_tokens.append(t_item)
                except Exception as e:
                    print(f"[VisionAgent] OCR helper fallback error: {e}")
                finally:
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except Exception:
                            pass
            else:
                for w in words:
                    token_item = {
                        "page": page_idx,
                        "x0": round(w[0], 2),
                        "y0": round(w[1], 2),
                        "x1": round(w[2], 2),
                        "y1": round(w[3], 2),
                        "text": w[4],
                        "block_num": w[5],
                        "line_num": w[6],
                        "word_num": w[7],
                    }
                    page_tokens.append(token_item)
                    all_tokens.append(token_item)

            total_word_count += len(page_tokens)
            page_extracted_text = page.get_text("text") or " ".join(t["text"] for t in page_tokens)
            full_text_pages.append(page_extracted_text)

            pages_data.append({
                "page": page_idx,
                "width": width,
                "height": height,
                "token_count": len(page_tokens),
                "block_count": len(page_blocks),
                "text": page.get_text("text")
            })

        # Infer document type based on keywords
        combined_text = "\n".join(full_text_pages).lower()
        if any(k in combined_text for k in ["patient", "icd-10", "cpt / code", "gross charge", "patient copay", "physician", "health information management"]):
            doc_type = "medical_billing"
        elif any(k in combined_text for k in ["faculty", "usn", "student", "course code", "course credit", "assignment", "obtained marks"]):
            doc_type = "academic_assignment"
        elif any(k in combined_text for k in ["nondisclosure", "non-disclosure", "nda", "confidentiality", "indemnification", "disclosing party", "master services agreement"]):
            doc_type = "nda_contract"
        elif any(k in combined_text for k in ["invoice", "bill to", "tax", "subtotal", "amount due"]):
            doc_type = "invoice"
        else:
            doc_type = "general_document"

        return {
            "page_count": len(doc),
            "doc_type": doc_type,
            "total_tokens": total_word_count,
            "tokens": all_tokens,
            "blocks": blocks_data,
            "pages": pages_data,
            "page_images": page_images,
            "full_text": "\n\n--- PAGE BREAK ---\n\n".join(full_text_pages)
        }
