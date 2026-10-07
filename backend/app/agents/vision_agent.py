import base64
import fitz  # PyMuPDF
from typing import Dict, List, Any, Tuple
import io

class VisionAgent:
    """
    Agent 1: Ingestion & Vision Agent
    - Reads raw PDF bytes
    - Extracts reading order, blocks, lines, and exact token bounding boxes (x0, y0, x1, y1)
    - Generates high-fidelity page images for canvas overlay
    - Returns structured spatial map
    """

    def process_document(self, doc_bytes: bytes) -> Dict[str, Any]:
        doc = fitz.open(stream=doc_bytes, filetype="pdf")
        
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

            total_word_count += len(words)
            full_text_pages.append(page.get_text("text"))

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
        if any(k in combined_text for k in ["faculty", "usn", "student", "course code", "course credit", "department of", "assignment", "obtained marks"]):
            doc_type = "academic_assignment"
        elif any(k in combined_text for k in ["patient", "medical", "physician", "icd-10", "diagnosis", "rx", "hospital"]):
            doc_type = "medical_billing"
        elif any(k in combined_text for k in ["nondisclosure", "non-disclosure", "nda", "confidentiality", "indemnification", "jurisdiction", "agreement"]):
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
