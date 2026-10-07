import os
import fitz
import numpy as np
from PIL import Image, ImageDraw

def generate_samples():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    samples_dir = os.path.join(base_dir, "samples")
    os.makedirs(samples_dir, exist_ok=True)

    # 1. Generate sample_redacted_photo.png (Realistic photo of academic assignment with black redaction bars)
    acad_pdf = os.path.join(samples_dir, "sample_academic_assignment.pdf")
    doc = fitz.open(acad_pdf)
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    img_bytes = pix.tobytes("png")
    doc.close()

    import io
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)

    sx = img.width / 595.0
    sy = img.height / 842.0

    # Student name "Alex Morgan" is at y=348 (val at x=190, y=348)
    x0, y0 = int(185 * sx), int((348 - 14) * sy)
    x1, y1 = int(320 * sx), int((348 + 5) * sy)
    draw.rectangle([x0, y0, x1, y1], fill=(12, 12, 12))

    # USN "SEC-A | STU-99281" is at y=370 (val at x=190, y=370)
    x0_u, y0_u = int(185 * sx), int((370 - 14) * sy)
    x1_u, y1_u = int(330 * sx), int((370 + 5) * sy)
    draw.rectangle([x0_u, y0_u, x1_u, y1_u], fill=(15, 15, 15))

    # Signature "(Dr. Sarah Jenkins)" is at y=498 (val at x=380, y=498)
    x0_s, y0_s = int(375 * sx), int((498 - 14) * sy)
    x1_s, y1_s = int(495 * sx), int((498 + 5) * sy)
    draw.rectangle([x0_s, y0_s, x1_s, y1_s], fill=(10, 10, 10))

    # Add slight photo-like lighting warmth & subtle camera texture
    img_np = np.array(img)
    noise = np.random.normal(0, 2.5, img_np.shape).astype(np.float32)
    img_noisy = np.clip(img_np.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    photo_out = Image.fromarray(img_noisy)

    photo_path = os.path.join(samples_dir, "sample_redacted_photo.png")
    photo_out.save(photo_path, "PNG")
    print("Created synthetic sample_redacted_photo.png at", photo_path)

    # 2. Generate sample_fake_redacted_medical.pdf (PDF with superficial black rectangles over text)
    med_pdf = os.path.join(samples_dir, "sample_medical_billing.pdf")
    med_doc = fitz.open(med_pdf)
    med_page = med_doc[0]

    # Patient Name: Rect(110, 154, 210, 168)
    med_page.draw_rect(fitz.Rect(110, 154, 210, 168), color=(0, 0, 0), fill=(0, 0, 0))
    # SSN: Rect(305, 154, 385, 168)
    med_page.draw_rect(fitz.Rect(305, 154, 385, 168), color=(0, 0, 0), fill=(0, 0, 0))
    # Policy ID: Rect(140, 194, 220, 208)
    med_page.draw_rect(fitz.Rect(140, 194, 220, 208), color=(0, 0, 0), fill=(0, 0, 0))

    fake_med_path = os.path.join(samples_dir, "sample_fake_redacted_medical.pdf")
    med_doc.save(fake_med_path)
    med_doc.close()
    print("Created sample_fake_redacted_medical.pdf at", fake_med_path)

if __name__ == "__main__":
    generate_samples()
