import os
import fitz

def generate_assignment_pdf(output_path: str):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4

    # Header
    page.insert_text(fitz.Point(70, 110), "DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING", fontsize=10.5, fontname="helv", color=(0.1, 0.1, 0.1))

    # Form Fields
    fields = [
        ("Name of the faculty", "Prof. Akshatha Bhat"),
        ("Designation", "Assistant Professor"),
        ("Name of the subject", "Introduction to Digital Image Processing"),
        ("Number of course credit", "3"),
        ("Course code", "4ENCO1021"),
        ("Course type", "L-T-P"),
        ("Date of announcement", "10-09-2026"),
        ("Date of submission", "22-09-2026"),
        ("Title", "Assignment"),
        ("Name of the student", "Maha Akshay R"),
        ("Section & USN", "F | 24BBTCS352"),
        ("Max. Marks", "30"),
        ("Obtained marks", ""),
    ]

    y = 150
    for label, val in fields:
        page.insert_text(fitz.Point(50, y), label, fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
        page.insert_text(fitz.Point(175, y), ":", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
        if val:
            page.insert_text(fitz.Point(190, y), val, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        y += 22

    # Signature
    page.insert_text(fitz.Point(360, 480), "Signature of the faculty", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text(fitz.Point(380, 498), "(Akshatha Bhat)", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text(fitz.Point(290, 800), "1", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print("Generated academic assignment PDF:", output_path)

if __name__ == "__main__":
    generate_assignment_pdf("samples/sample_academic_assignment.pdf")
