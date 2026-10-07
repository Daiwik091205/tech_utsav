import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_modern_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6] # Blank slide

    # Color Palette (Dark Modern Tech)
    BG_DARK = RGBColor(11, 15, 25)         # #0B0F19
    SURFACE_CARD = RGBColor(21, 30, 50)    # #151E32
    SURFACE_CARD_ALT = RGBColor(15, 23, 42) # #0F172A
    BORDER_COLOR = RGBColor(35, 50, 82)    # #233252
    
    PRIMARY_CYAN = RGBColor(6, 182, 212)   # #06B6D4
    PRIMARY_INDIGO = RGBColor(99, 102, 241) # #6366F1
    ACCENT_EMERALD = RGBColor(16, 185, 129) # #10B981
    ACCENT_ROSE = RGBColor(244, 63, 94)    # #F43F5E
    ACCENT_AMBER = RGBColor(245, 158, 11)  # #F59E0B
    
    TEXT_LIGHT = RGBColor(255, 255, 255)
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8
    TEXT_SUBTLE = RGBColor(100, 116, 139)  # #64748B

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.color.rgb = BG_DARK
        return bg

    def add_header(slide, tag_text, title_text, subtitle_text=None):
        # Category Tag Pill
        tag_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.5), Inches(2.8), Inches(0.35))
        tag_box.fill.solid()
        tag_box.fill.fore_color.rgb = RGBColor(30, 27, 75) # Indigo dark
        tag_box.line.color.rgb = PRIMARY_INDIGO
        tag_tf = tag_box.text_frame
        tag_tf.word_wrap = True
        tag_tf.margin_top = Inches(0.04)
        tag_p = tag_tf.paragraphs[0]
        tag_p.text = tag_text.upper()
        tag_p.font.size = Pt(10)
        tag_p.font.bold = True
        tag_p.font.color.rgb = PRIMARY_CYAN
        tag_p.alignment = PP_ALIGN.CENTER

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.7))
        title_tf = title_box.text_frame
        title_tf.word_wrap = True
        title_tf.margin_top = Inches(0)
        title_tf.margin_left = Inches(0)
        p = title_tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = TEXT_LIGHT

        # Subtitle
        if subtitle_text:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.7), Inches(0.45))
            sub_tf = sub_box.text_frame
            sub_tf.word_wrap = True
            sub_tf.margin_top = Inches(0)
            sub_tf.margin_left = Inches(0)
            sub_p = sub_tf.paragraphs[0]
            sub_p.text = subtitle_text
            sub_p.font.size = Pt(13)
            sub_p.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=SURFACE_CARD, border_color=BORDER_COLOR):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        return card

    # ==========================================================
    # SLIDE 1: Title Slide
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Accent decorative banner card
    add_card(s1, 0.8, 1.2, 11.73, 5.1, SURFACE_CARD_ALT, BORDER_COLOR)

    # Tag Badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.7), Inches(3.6), Inches(0.4))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(17, 24, 39)
    badge.line.color.rgb = PRIMARY_CYAN
    badge_tf = badge.text_frame
    badge_p = badge_tf.paragraphs[0]
    badge_p.text = "AIR-GAPPED COMPLIANCE & PRIVACY ENGINE"
    badge_p.font.size = Pt(11)
    badge_p.font.bold = True
    badge_p.font.color.rgb = PRIMARY_CYAN
    badge_p.alignment = PP_ALIGN.CENTER

    # Hero Title
    hero_box = s1.shapes.add_textbox(Inches(1.3), Inches(2.3), Inches(10.7), Inches(1.8))
    htf = hero_box.text_frame
    htf.word_wrap = True
    p1 = htf.paragraphs[0]
    p1.text = "Enterprise Multi-Agent Document Intelligence\n& Hardware Redaction Engine"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_LIGHT

    # Hero Subtitle
    sub_box = s1.shapes.add_textbox(Inches(1.3), Inches(4.3), Inches(10.7), Inches(0.8))
    stf = sub_box.text_frame
    stf.word_wrap = True
    sp = stf.paragraphs[0]
    sp.text = "An air-gapped, privacy-preserving pipeline: Spatial layout parsing, Microsoft Presidio NER, true PyMuPDF pixel burn-in, Pydantic structured extraction & differential privacy."
    sp.font.size = Pt(14)
    sp.font.color.rgb = TEXT_MUTED

    # Bottom Metadata Pills
    pill_items = [
        ("Zero Data Egress", ACCENT_EMERALD),
        ("Hardware Pixel Burn-In", PRIMARY_CYAN),
        ("HIPAA § 164 & FERPA Ready", PRIMARY_INDIGO),
        ("4 Asynchronous Agents", ACCENT_AMBER)
    ]
    for idx, (label, col) in enumerate(pill_items):
        p_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3 + idx * 2.7), Inches(5.3), Inches(2.5), Inches(0.45))
        p_card.fill.solid()
        p_card.fill.fore_color.rgb = SURFACE_CARD
        p_card.line.color.rgb = col
        ptf = p_card.text_frame
        ptf.margin_top = Inches(0.08)
        pp = ptf.paragraphs[0]
        pp.text = f"• {label}"
        pp.font.size = Pt(11)
        pp.font.bold = True
        pp.font.color.rgb = col
        pp.alignment = PP_ALIGN.CENTER

    # ==========================================================
    # SLIDE 2: Problem Statement
    # ==========================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Industry Challenge", "The Enterprise Document Privacy Paradox", "Why standard cloud AI and visual PDF tools fail regulatory compliance")

    p_cards = [
        ("1. The 'Fake Redaction' Disaster", 
         "Standard tools (Adobe, Preview) often draw black SVG boxes over text.\nUnderlying character streams and metadata remain fully selectable and extractable in memory.\nViolates HIPAA, GDPR, and enterprise NDA safeguards.",
         ACCENT_ROSE),
        ("2. Cloud LLM Data Leaks",
         "Pumping sensitive intake documents (clinical records, NDAs, student IDs) to public cloud APIs violates data residency.\nExposes organizations to massive statutory non-compliance fines.",
         ACCENT_AMBER),
        ("3. Monolithic Prompt Breakdown",
         "Stuffing 30-page complex PDFs into a single monolithic LLM prompt leads to token bloat, dense table distortion, hallucinations, and zero spatial coordinate accuracy.",
         PRIMARY_INDIGO)
    ]
    for idx, (title, desc, col) in enumerate(p_cards):
        add_card(s2, 0.8 + idx * 3.95, 2.1, 3.8, 4.6, SURFACE_CARD, col)
        tb = s2.shapes.add_textbox(Inches(1.0 + idx * 3.95), Inches(2.3), Inches(3.4), Inches(4.2))
        tf = tb.text_frame
        tf.word_wrap = True
        
        tp = tf.paragraphs[0]
        tp.text = title
        tp.font.size = Pt(18)
        tp.font.bold = True
        tp.font.color.rgb = col
        tp.space_after = Pt(14)

        for line in desc.split("\n"):
            lp = tf.add_paragraph()
            lp.text = f"• {line}"
            lp.font.size = Pt(13)
            lp.font.color.rgb = TEXT_MUTED
            lp.space_after = Pt(10)

    # ==========================================================
    # SLIDE 3: Solution Architecture Overview
    # ==========================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Our Solution", "Air-Gapped Multi-Agent Intelligence Engine", "Deterministic Directed Acyclic Graph (DAG) with specialized local nodes")

    sol_cards = [
        ("Deterministic DAG vs. Monolithic LLM",
         "Tasks are distributed across specialized agents with strict separation of concerns: Layout Parsing &rarr; Privacy Scanning &rarr; Schema Structuring &rarr; Risk Evaluation.",
         PRIMARY_CYAN),
        ("100% Air-Gapped Local Execution",
         "Zero external telemetry. Runs completely on local hardware using PyMuPDF, Microsoft Presidio NER, and open-weights LLMs (Ollama / Qwen / Llama).",
         ACCENT_EMERALD),
        ("True Hardware Pixel Burn-In",
         "Directly burns black pixels into the vector raster stream via PyMuPDF (fitz.PDF_REDACT_IMAGE_PIXELS). Underlying text glyphs are physically expunged.",
         ACCENT_ROSE),
        ("Real-Time Reactive SSE Telemetry",
         "No static spinners. Server-Sent Events stream each agent's execution phase, token count, and detected entities live to the frontend in milliseconds.",
         PRIMARY_INDIGO)
    ]

    for idx, (title, desc, col) in enumerate(sol_cards):
        r = idx // 2
        c = idx % 2
        add_card(s3, 0.8 + c * 5.95, 2.1 + r * 2.45, 5.75, 2.25, SURFACE_CARD, col)
        tb = s3.shapes.add_textbox(Inches(1.0 + c * 5.95), Inches(2.25 + r * 2.45), Inches(5.35), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        
        tp = tf.paragraphs[0]
        tp.text = title
        tp.font.size = Pt(16)
        tp.font.bold = True
        tp.font.color.rgb = col
        tp.space_after = Pt(8)

        dp = tf.add_paragraph()
        dp.text = desc
        dp.font.size = Pt(13)
        dp.font.color.rgb = TEXT_MUTED
        dp.line_spacing = 1.2

    # ==========================================================
    # SLIDE 4: The 4 Specialized Agents
    # ==========================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Multi-Agent Topology", "The 4 Specialized Agent Nodes", "Directed Acyclic Graph orchestrated via FastAPI & Server-Sent Events")

    agents = [
        ("Agent 1: Ingestion & Vision", "PyMuPDF Spatial Parser", "Extracts spatial tokens, reading order, and exact character bounding boxes [x0, y0, x1, y1] in sub-200ms.", PRIMARY_CYAN),
        ("Agent 2: Schema Structuring", "Open-Weights Local LLM", "Forces type-safe Pydantic JSON schemas. Extracts medical billing line-items, contracts, or academic records.", PRIMARY_INDIGO),
        ("Agent 3: Compliance & Risk", "Vectorized Benchmark Evaluator", "Compares clauses against enterprise baselines. Flags unlimited liability, foreign courts & FERPA risks with suggested redlines.", ACCENT_AMBER),
        ("Agent 4: Privacy & Redaction", "Presidio NER + PyMuPDF Burn-In", "Detects SSNs, names, USNs & medical IDs. Burns physical black pixels into the vector stream. Zero text leakage.", ACCENT_ROSE)
    ]

    for idx, (name, tech, desc, col) in enumerate(agents):
        add_card(s4, 0.8 + idx * 2.95, 2.1, 2.8, 4.6, SURFACE_CARD, col)
        tb = s4.shapes.add_textbox(Inches(0.95 + idx * 2.95), Inches(2.25), Inches(2.5), Inches(4.2))
        tf = tb.text_frame
        tf.word_wrap = True

        np = tf.paragraphs[0]
        np.text = name
        np.font.size = Pt(15)
        np.font.bold = True
        np.font.color.rgb = col
        np.space_after = Pt(4)

        tp = tf.add_paragraph()
        tp.text = tech
        tp.font.size = Pt(11)
        tp.font.bold = True
        tp.font.color.rgb = TEXT_MUTED
        tp.space_after = Pt(12)

        dp = tf.add_paragraph()
        dp.text = desc
        dp.font.size = Pt(12)
        dp.font.color.rgb = TEXT_MUTED
        dp.line_spacing = 1.2

    # ==========================================================
    # SLIDE 5: Deep-Dive: True Hardware Pixel Redaction
    # ==========================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Security Engineering", "True Hardware Pixel Burn-In vs. Fake Redaction", "Permanent vector stream expungement and zero character leakage")

    # Left Card: Traditional Fake Redaction
    add_card(s5, 0.8, 2.1, 5.75, 4.6, SURFACE_CARD, ACCENT_ROSE)
    tb_l = s5.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.35), Inches(4.2))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True

    p = tf_l.paragraphs[0]
    p.text = "Traditional Commercial Tools (Flawed)"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE
    p.space_after = Pt(12)

    fake_points = [
        "Draws a black SVG or visual rectangle on a top visual layer.",
        "Underlying PDF stream retains original character glyphs & font tables.",
        "Anyone can select, copy-paste, or run pdfminer/strings to extract PII.",
        "Fails HIPAA 45 CFR § 164 Safe Harbor and GDPR statutory audits.",
        "Creates massive legal liability during external audits."
    ]
    for pt in fake_points:
        lp = tf_l.add_paragraph()
        lp.text = f"✕  {pt}"
        lp.font.size = Pt(13)
        lp.font.color.rgb = TEXT_MUTED
        lp.space_after = Pt(8)

    # Right Card: Our True Redaction Engine
    add_card(s5, 6.75, 2.1, 5.75, 4.6, SURFACE_CARD, ACCENT_EMERALD)
    tb_r = s5.shapes.add_textbox(Inches(6.95), Inches(2.3), Inches(5.35), Inches(4.2))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    p = tf_r.paragraphs[0]
    p.text = "Our Engine: Hardware Pixel Burn-In"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(12)

    true_points = [
        "PyMuPDF page.add_redact_annot() identifies exact canvas coordinates.",
        "fitz.PDF_REDACT_IMAGE_PIXELS burns pure black pixels into raster bitmaps.",
        "Vector streams, font definitions, and glyph positions are expunged.",
        "Automated verification: Post-redaction text stream scan confirms 0 matches.",
        "Protected template labels: Designation, Max. Marks preserved 100%."
    ]
    for pt in true_points:
        lp = tf_r.add_paragraph()
        lp.text = f"✓  {pt}"
        lp.font.size = Pt(13)
        lp.font.color.rgb = TEXT_MUTED
        lp.space_after = Pt(8)

    # ==========================================================
    # SLIDE 6: Differential Privacy & Cryptographic Verification
    # ==========================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Mathematical Guarantees", "Differential Privacy & Cryptographic Audit Trails", "Provable mathematical security combined with SHA-256 verifiable audit records")

    add_card(s6, 0.8, 2.1, 5.75, 4.6, SURFACE_CARD, PRIMARY_CYAN)
    tb_dp = s6.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.35), Inches(4.2))
    tf_dp = tb_dp.text_frame
    tf_dp.word_wrap = True

    p = tf_dp.paragraphs[0]
    p.text = "Mathematical Differential Privacy (DP)"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_CYAN
    p.space_after = Pt(12)

    dp_points = [
        "Prevents Reconstruction & Linkage Attacks: Protects statistical aggregates.",
        "Calibrated Laplace Mechanism: Injects noise drawn from Laplace(0, Δf / ε).",
        "Configured Epsilon: ε = 0.5 delivers strict privacy loss bound.",
        "k-Anonymity Baseline: k=5 generalization on quasi-identifiers (age, dates).",
        "Guarantees that individual patient/client presence cannot be reverse-engineered."
    ]
    for pt in dp_points:
        lp = tf_dp.add_paragraph()
        lp.text = f"• {pt}"
        lp.font.size = Pt(13)
        lp.font.color.rgb = TEXT_MUTED
        lp.space_after = Pt(8)

    add_card(s6, 6.75, 2.1, 5.75, 4.6, SURFACE_CARD, PRIMARY_INDIGO)
    tb_audit = s6.shapes.add_textbox(Inches(6.95), Inches(2.3), Inches(5.35), Inches(4.2))
    tf_audit = tb_audit.text_frame
    tf_audit.word_wrap = True

    p = tf_audit.paragraphs[0]
    p.text = "Cryptographic SHA-256 Audit Digest"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(12)

    audit_points = [
        "Cryptographic Digest: Computes immutable SHA-256 hash across result payloads.",
        "Audit Log Export: Generates downloadable JSON report for compliance officers.",
        "Traceability: Logs exact timestamp, redacted token count, and risk scores.",
        "Verification Modal: Built-in UI query tool allows live in-memory string search.",
        "ERP Integration: Formatted for direct automated webhook ingestion."
    ]
    for pt in audit_points:
        lp = tf_audit.add_paragraph()
        lp.text = f"• {pt}"
        lp.font.size = Pt(13)
        lp.font.color.rgb = TEXT_MUTED
        lp.space_after = Pt(8)

    # ==========================================================
    # SLIDE 7: Dual-Pane UI & Synchronized Inspection
    # ==========================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Operator Experience", "Interactive Dual-Pane Document Intelligence UI", "Built with React, Vite, Tailwind CSS & HTML Canvas")

    ui_cards = [
        ("Zone 1: Pipeline Timeline", "Real-time reactive ticker displaying sub-second agent milestones, token counts, and bounding box coordinates mapped.", PRIMARY_CYAN),
        ("Zone 2: Dual Canvas View", "Side-by-side split comparison: Left shows flagged PII overlays; Right renders clean PDF with blackened pixels burned in.", ACCENT_EMERALD),
        ("Synchronous Magnification", "Proportional 60% to 225% synchronous zoom controls with smooth panning and mathematical overlay alignment.", PRIMARY_INDIGO),
        ("Zone 3: Compliance Cards", "Color-coded risk findings (High/Med/Low) with one-click copyable redline revisions and type-safe JSON schema view.", ACCENT_ROSE)
    ]
    for idx, (title, desc, col) in enumerate(ui_cards):
        r = idx // 2
        c = idx % 2
        add_card(s7, 0.8 + c * 5.95, 2.1 + r * 2.45, 5.75, 2.25, SURFACE_CARD, col)
        tb = s7.shapes.add_textbox(Inches(1.0 + c * 5.95), Inches(2.25 + r * 2.45), Inches(5.35), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        
        tp = tf.paragraphs[0]
        tp.text = title
        tp.font.size = Pt(16)
        tp.font.bold = True
        tp.font.color.rgb = col
        tp.space_after = Pt(8)

        dp = tf.add_paragraph()
        dp.text = desc
        dp.font.size = Pt(13)
        dp.font.color.rgb = TEXT_MUTED
        dp.line_spacing = 1.2

    # ==========================================================
    # SLIDE 8: Multi-Modal Document Versatility
    # ==========================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Versatility & Use Cases", "Demonstrated Multi-Sector Scenarios", "3 ready-to-test booth presets plus arbitrary PDF drag-and-drop ingestion")

    cases = [
        ("Sample 1: Medical Billing",
         "Healthcare (HIPAA Safe Harbor)",
         "• Redacts Patient Name, SSN, DOB, Address, Policy ID\n• Preserves ICD-10 diagnosis codes & charges table\n• NSA Balance Billing validation ($14,250 gross charge)\n• Differential Privacy on copay & financial totals",
         PRIMARY_CYAN),
        ("Sample 2: Tech Vendor NDA",
         "Enterprise Legal & Procurement",
         "• Flags Clause 8.2: Unilateral Unlimited Indemnification\n• Flags Clause 14.1: Foreign Zurich Court Jurisdiction\n• Flags Clause 4.3: Non-standard 10-year survival term\n• Instant suggested enterprise redline clause replacements",
         ACCENT_ROSE),
        ("Sample 3: Academic Assignment",
         "Higher Education & Research",
         "• FERPA student privacy: masks Student Name & USN ID\n• Evaluates double-blind grading compliance\n• Extracts Course Code, Department, and Credits\n• Zero false-positive redaction on form headers",
         ACCENT_EMERALD)
    ]
    for idx, (title, sub, details, col) in enumerate(cases):
        add_card(s8, 0.8 + idx * 3.95, 2.1, 3.8, 4.6, SURFACE_CARD, col)
        tb = s8.shapes.add_textbox(Inches(1.0 + idx * 3.95), Inches(2.3), Inches(3.4), Inches(4.2))
        tf = tb.text_frame
        tf.word_wrap = True

        tp = tf.paragraphs[0]
        tp.text = title
        tp.font.size = Pt(17)
        tp.font.bold = True
        tp.font.color.rgb = col

        sp = tf.add_paragraph()
        sp.text = sub
        sp.font.size = Pt(11)
        sp.font.bold = True
        sp.font.color.rgb = TEXT_LIGHT
        sp.space_after = Pt(12)

        for line in details.split("\n"):
            lp = tf.add_paragraph()
            lp.text = line
            lp.font.size = Pt(12)
            lp.font.color.rgb = TEXT_MUTED
            lp.space_after = Pt(6)

    # ==========================================================
    # SLIDE 9: Performance Benchmarks & Business Impact
    # ==========================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Metrics & ROI", "Production Performance & Business Impact", "Empirical execution benchmarks on commodity local hardware")

    metrics = [
        ("< 4.0s", "End-to-End Pipeline Runtime", "From raw PDF drop to burned clean PDF, Pydantic schema & audit log", PRIMARY_CYAN),
        ("0 Bytes", "Cloud Data Egress", "100% local execution. Fully air-gapped without external API calls", ACCENT_EMERALD),
        ("0 Traces", "Residual Text Leakage", "Permanently clears vector stream character coordinates in memory", ACCENT_ROSE),
        ("80%", "Review Time Reduction", "Automates contract deviation identification and suggested redlines", PRIMARY_INDIGO)
    ]
    for idx, (stat, label, desc, col) in enumerate(metrics):
        add_card(s9, 0.8 + idx * 2.95, 2.1, 2.8, 4.6, SURFACE_CARD, col)
        tb = s9.shapes.add_textbox(Inches(0.95 + idx * 2.95), Inches(2.4), Inches(2.5), Inches(4.0))
        tf = tb.text_frame
        tf.word_wrap = True

        sp = tf.paragraphs[0]
        sp.text = stat
        sp.font.size = Pt(36)
        sp.font.bold = True
        sp.font.color.rgb = col
        sp.space_after = Pt(8)

        lp = tf.add_paragraph()
        lp.text = label
        lp.font.size = Pt(14)
        lp.font.bold = True
        lp.font.color.rgb = TEXT_LIGHT
        lp.space_after = Pt(12)

        dp = tf.add_paragraph()
        dp.text = desc
        dp.font.size = Pt(12)
        dp.font.color.rgb = TEXT_MUTED
        dp.line_spacing = 1.2

    # ==========================================================
    # SLIDE 10: Conclusion & Roadmap
    # ==========================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Summary & Future Work", "Conclusion & Next-Generation Roadmap", "Transforming regulated document workflows with multi-agent guarantees")

    # Left: Why We Win
    add_card(s10, 0.8, 2.1, 5.75, 4.6, SURFACE_CARD, PRIMARY_CYAN)
    tb_w = s10.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.35), Inches(4.2))
    tf_w = tb_w.text_frame
    tf_w.word_wrap = True

    p = tf_w.paragraphs[0]
    p.text = "Why Our Solution Wins"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_CYAN
    p.space_after = Pt(12)

    win_pts = [
        "True Security vs. Cosmetic Security: Hardware burn-in destroys glyphs permanently.",
        "Air-Gapped Compliance: Zero external LLM token egress or API dependency.",
        "Modular Multi-Agent DAG: Decouples spatial vision, NER, extraction & risk assessment.",
        "Mathematical Guarantees: Differential privacy prevents reconstruction attacks.",
        "Ready Today: Operates on commodity enterprise laptops in sub-4 seconds."
    ]
    for pt in win_pts:
        lp = tf_w.add_paragraph()
        lp.text = f"★  {pt}"
        lp.font.size = Pt(13)
        lp.font.color.rgb = TEXT_MUTED
        lp.space_after = Pt(8)

    # Right: Future Roadmap
    add_card(s10, 6.75, 2.1, 5.75, 4.6, SURFACE_CARD, ACCENT_EMERALD)
    tb_road = s10.shapes.add_textbox(Inches(6.95), Inches(2.3), Inches(5.35), Inches(4.2))
    tf_road = tb_road.text_frame
    tf_road.word_wrap = True

    p = tf_road.paragraphs[0]
    p.text = "Future Technical Roadmap"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(12)

    road_pts = [
        "On-Device Handwritten OCR: Integration with local TrOCR & PaddleOCR engines.",
        "Multi-Tenant RBAC: Role-based redaction policies (clinician vs. billing clerk views).",
        "Automated ERP & EMR Connectors: Direct FHIR / Epic & SAP webhook ingestion.",
        "Zero-Knowledge Audit Attestation: zk-SNARK proofs of redaction correctness."
    ]
    for pt in road_pts:
        lp = tf_road.add_paragraph()
        lp.text = f"→  {pt}"
        lp.font.size = Pt(13)
        lp.font.color.rgb = TEXT_MUTED
        lp.space_after = Pt(8)

    # Closing Callout
    cp = tf_road.add_paragraph()
    cp.text = "\nThank you, Judges! Ready for Q&A."
    cp.font.size = Pt(14)
    cp.font.bold = True
    cp.font.color.rgb = TEXT_LIGHT

    # Save Presentation
    output_path = os.path.abspath("Enterprise_Document_Intelligence_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_modern_presentation()
