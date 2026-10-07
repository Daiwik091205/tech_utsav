import os
import fitz  # PyMuPDF

def generate_medical_bill(output_path: str):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4 size

    # Header styling
    page.draw_rect(fitz.Rect(30, 30, 565, 85), color=(0.1, 0.3, 0.6), fill=(0.95, 0.97, 1.0), width=1)
    page.insert_text(fitz.Point(45, 55), "APEX MEMORIAL HOSPITAL & IMAGING CENTER", fontsize=15, fontname="helv", color=(0.08, 0.2, 0.5))
    page.insert_text(fitz.Point(45, 72), "Department of Billing & Health Information Management | 100 Hospital Way, Portland, OR 97201", fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))

    page.insert_text(fitz.Point(45, 110), "CONFIDENTIAL PATIENT BILLING STATEMENT", fontsize=13, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text(fitz.Point(430, 110), "DATE: 2026-08-14", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))

    # Patient info box
    page.draw_rect(fitz.Rect(30, 125, 565, 220), color=(0.8, 0.8, 0.8), fill=(0.98, 0.98, 0.98), width=0.8)
    page.insert_text(fitz.Point(45, 145), "PATIENT DEMOGRAPHICS (RESTRICTED PHI):", fontsize=9.5, fontname="helv", color=(0.7, 0.1, 0.1))
    
    # Direct identifiers
    page.insert_text(fitz.Point(45, 165), "Patient Name: John Doe", fontsize=10, fontname="helv", color=(0, 0, 0))
    page.insert_text(fitz.Point(280, 165), "SSN: 123-45-6789", fontsize=10, fontname="helv", color=(0, 0, 0))
    
    page.insert_text(fitz.Point(45, 185), "Address: 742 Evergreen Terrace, Springfield, OR 97477", fontsize=10, fontname="helv", color=(0, 0, 0))
    page.insert_text(fitz.Point(430, 185), "Phone: (555) 234-8901", fontsize=10, fontname="helv", color=(0, 0, 0))

    page.insert_text(fitz.Point(45, 205), "Insurance Policy ID: MED-99482", fontsize=10, fontname="helv", color=(0, 0, 0))
    page.insert_text(fitz.Point(280, 205), "DOB: 04/12/1984 (Age: 42)", fontsize=10, fontname="helv", color=(0, 0, 0))
    page.insert_text(fitz.Point(430, 205), "Facility NPI: 1942083921", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))

    # Diagnosis & Clinical coding
    page.insert_text(fitz.Point(45, 245), "DIAGNOSTIC CODING (ICD-10-CM):", fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text(fitz.Point(45, 262), "• M54.5 - Low back pain, lumbar spine radiculopathy", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text(fitz.Point(45, 276), "• R07.9 - Chest pain, unspecified etiology", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))

    # Table Header
    page.draw_rect(fitz.Rect(30, 295, 565, 318), color=(0.1, 0.3, 0.6), fill=(0.15, 0.35, 0.65), width=1)
    page.insert_text(fitz.Point(40, 310), "CPT / CODE", fontsize=9, fontname="helv", color=(1, 1, 1))
    page.insert_text(fitz.Point(120, 310), "SERVICE DESCRIPTION", fontsize=9, fontname="helv", color=(1, 1, 1))
    page.insert_text(fitz.Point(420, 310), "UNITS", fontsize=9, fontname="helv", color=(1, 1, 1))
    page.insert_text(fitz.Point(480, 310), "GROSS CHARGE", fontsize=9, fontname="helv", color=(1, 1, 1))

    # Table Rows
    rows = [
        ("99214", "Office/Outpatient Visit Complex 40min", "1", "$380.00"),
        ("72148", "MRI Lumbar Spine without Contrast", "1", "$3,420.00"),
        ("70553", "MRI Brain with & without Contrast", "1", "$4,150.00"),
        ("99152", "Moderate Sedation Initial 15min", "1", "$600.00"),
        ("00670", "Anesthesia for Extensive Spine Procedure", "1", "$5,700.00"),
    ]

    y = 335
    for cpt, desc, units, charge in rows:
        page.draw_rect(fitz.Rect(30, y - 14, 565, y + 8), color=(0.9, 0.9, 0.9), fill=(0.99, 0.99, 0.99), width=0.5)
        page.insert_text(fitz.Point(40, y), cpt, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text(fitz.Point(120, y), desc, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text(fitz.Point(435, y), units, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text(fitz.Point(495, y), charge, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
        y += 24

    # Summary box
    page.draw_rect(fitz.Rect(320, y + 10, 565, y + 105), color=(0.8, 0.8, 0.8), fill=(0.95, 0.95, 0.95), width=0.8)
    page.insert_text(fitz.Point(335, y + 30), "Total Gross Charges:", fontsize=9.5, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text(fitz.Point(480, y + 30), "$14,250.00", fontsize=9.5, fontname="helv", color=(0.1, 0.1, 0.1))

    page.insert_text(fitz.Point(335, y + 50), "Contracted Plan Adjustment:", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text(fitz.Point(480, y + 50), "-$8,400.00", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))

    page.insert_text(fitz.Point(335, y + 70), "Insurance Paid Direct:", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text(fitz.Point(480, y + 70), "-$4,850.00", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))

    page.insert_text(fitz.Point(335, y + 95), "PATIENT COPAY DUE:", fontsize=10, fontname="helv", color=(0.8, 0.1, 0.1))
    page.insert_text(fitz.Point(480, y + 95), "$1,000.00", fontsize=10, fontname="helv", color=(0.8, 0.1, 0.1))

    # Footer note
    page.insert_text(fitz.Point(45, 780), "NOTICE OF PRIVACY PRACTICES: Contains protected health information (PHI) governed by 45 CFR Part 160 & 164.", fontsize=7.5, fontname="helv", color=(0.5, 0.5, 0.5))
    page.insert_text(fitz.Point(45, 792), "For billing disputes, contact compliance@apexmemorial.org or call patient billing services.", fontsize=7.5, fontname="helv", color=(0.5, 0.5, 0.5))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Generated Medical Billing Statement at: {output_path}")

def generate_tech_nda(output_path: str):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4 size

    # Header
    page.insert_text(fitz.Point(120, 60), "ENTERPRISE MASTER SERVICES AGREEMENT & NDA", fontsize=13, fontname="helv", color=(0.1, 0.1, 0.1))
    page.draw_line(fitz.Point(50, 75), fitz.Point(545, 75), color=(0.2, 0.2, 0.2), width=1)

    page.insert_text(fitz.Point(50, 105), "This Mutual Non-Disclosure Agreement (the 'Agreement') is entered into as of September 1, 2026, by and between:", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text(fitz.Point(50, 125), "• Apex Cloud Dynamics Inc., a Delaware corporation ('Disclosing Party'), and", fontsize=9, fontname="helv", color=(0, 0, 0))
    page.insert_text(fitz.Point(50, 140), "• Quantum Data Systems Ltd., a tech provider ('Receiving Party').", fontsize=9, fontname="helv", color=(0, 0, 0))

    page.insert_text(fitz.Point(50, 170), "1. PURPOSE & PROPRIETARY INFORMATION", fontsize=10, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text(fitz.Point(50, 188), "The parties intend to explore strategic cloud infrastructure integrations and proprietary AI pipeline development.", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text(fitz.Point(50, 215), "2. CONFIDENTIALITY STANDARD OF CARE", fontsize=10, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text(fitz.Point(50, 233), "Recipient agrees to hold Discloser's Proprietary Information in confidence using the same degree of care it uses for", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text(fitz.Point(50, 246), "its own confidential assets, but not less than reasonable care.", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))

    page.insert_text(fitz.Point(50, 275), "4. TERM & DURATION OF OBLIGATIONS (CLAUSE 4.3 - HIGH DURATION)", fontsize=10, fontname="helv", color=(0.7, 0.3, 0.0))
    page.insert_text(fitz.Point(50, 293), "The confidentiality obligations hereunder shall survive execution and endure for a term of ten (10) years from the Effective Date,", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text(fitz.Point(50, 306), "or indefinitely thereafter for all intellectual property and proprietary algorithms disclosed.", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))

    # High risk clause 8.2 box
    page.draw_rect(fitz.Rect(45, 335, 550, 430), color=(0.8, 0.2, 0.2), fill=(1.0, 0.96, 0.96), width=1)
    page.insert_text(fitz.Point(55, 355), "SECTION 8.2: UNILATERAL INDEMNIFICATION & LIABILITY [HIGH RISK CLAUSE]", fontsize=9.5, fontname="helv", color=(0.8, 0.1, 0.1))
    page.insert_text(fitz.Point(55, 375), "Customer shall indemnify, defend, and hold harmless Vendor against any and all claims, liabilities, and damages", fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text(fitz.Point(55, 390), "without limitation, whether direct, consequential, or exemplary. Neither Vendor nor its affiliates shall be subject", fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text(fitz.Point(55, 405), "to any financial liability cap under this Agreement.", fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))

    # Foreign jurisdiction clause 14.1 box
    page.draw_rect(fitz.Rect(45, 450, 550, 530), color=(0.8, 0.5, 0.1), fill=(1.0, 0.98, 0.94), width=1)
    page.insert_text(fitz.Point(55, 470), "SECTION 14.1: GOVERNING LAW & OVERSEAS ARBITRATION [JURISDICTION RISK]", fontsize=9.5, fontname="helv", color=(0.7, 0.4, 0.0))
    page.insert_text(fitz.Point(55, 490), "This Agreement shall be governed by and construed in accordance with the laws of the Canton of Zurich, Switzerland,", fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text(fitz.Point(55, 505), "submitting to exclusive overseas court jurisdiction and Swiss Rules of International Arbitration.", fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))

    page.insert_text(fitz.Point(50, 560), "16. INTELLECTUAL PROPERTY RIGHTS", fontsize=10, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text(fitz.Point(50, 578), "Vendor retains exclusive worldwide ownership over all underlying models, weights, schemas, and derivative integrations.", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))

    # Signatures
    page.draw_line(fitz.Point(50, 680), fitz.Point(240, 680), color=(0.4, 0.4, 0.4), width=1)
    page.insert_text(fitz.Point(50, 695), "For: Apex Cloud Dynamics Inc.", fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text(fitz.Point(50, 710), "Name: Sarah Jenkins, VP Legal", fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))

    page.draw_line(fitz.Point(340, 680), fitz.Point(530, 680), color=(0.4, 0.4, 0.4), width=1)
    page.insert_text(fitz.Point(340, 695), "For: Quantum Data Systems Ltd.", fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text(fitz.Point(340, 710), "Name: Marcus Vance, Managing Director", fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Generated Tech NDA at: {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    samples_dir = os.path.join(base_dir, "samples")
    generate_medical_bill(os.path.join(samples_dir, "sample_medical_billing.pdf"))
    generate_tech_nda(os.path.join(samples_dir, "sample_tech_vendor_nda.pdf"))
