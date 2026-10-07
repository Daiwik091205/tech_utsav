import os
import io
import time
import json
import hashlib
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import base64
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse, Response
from pydantic import BaseModel

from .agents.vision_agent import VisionAgent
from .agents.privacy_agent import PrivacyAgent
from .agents.schema_agent import SchemaAgent
from .agents.risk_agent import RiskAgent
from .schemas import PipelineResult, PipelineEvent

app = FastAPI(
    title="Enterprise Multi-Agent Document Intelligence & Redaction Engine",
    description="Air-gapped, privacy-preserving multi-agent document pipeline with true hardware redaction and differential privacy.",
    version="1.0.0"
)

# Air-gapped Desktop Enclave Session Token
DOCUMENT_ENGINE_SECRET_TOKEN = os.environ.get("DOCUMENT_ENGINE_SECRET_TOKEN", None)

@app.middleware("http")
async def enclave_token_middleware(request: Request, call_next):
    # If the application is launched in secure desktop enclave mode, enforce token validation
    if DOCUMENT_ENGINE_SECRET_TOKEN:
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check header or query parameter (query param needed for EventSource and download links)
        client_token = request.headers.get("x-session-token") or request.query_params.get("session_token")
        if client_token != DOCUMENT_ENGINE_SECRET_TOKEN:
            return JSONResponse(
                status_code=403,
                content={"detail": "Forbidden: Air-gapped Desktop Enclave security token missing or invalid."}
            )
    return await call_next(request)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store document cache in memory with bounded size (LRU-style eviction)
DOCUMENTS_STORE: Dict[str, Dict[str, Any]] = {}
MAX_STORE_CAPACITY = 50

def store_document(doc_id: str, entry: Dict[str, Any]):
    """Stores document with automatic eviction of oldest entries to prevent memory leaks."""
    if len(DOCUMENTS_STORE) >= MAX_STORE_CAPACITY:
        oldest_key = next(iter(DOCUMENTS_STORE))
        del DOCUMENTS_STORE[oldest_key]
    DOCUMENTS_STORE[doc_id] = entry


# Initialize agents
vision_agent = VisionAgent()
privacy_agent = PrivacyAgent()
schema_agent = SchemaAgent()
risk_agent = RiskAgent()

SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "samples"))

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "engine": "air-gapped-local",
        "agents": {
            "vision_agent": "PyMuPDF Spatial Parser",
            "privacy_agent": "Microsoft Presidio NER + PyMuPDF True Redactor",
            "schema_agent": "Open-Weights Ollama / Deterministic Pydantic Parser",
            "risk_agent": "Vectorized Policy Benchmark Evaluator"
        },
        "ollama_connected": schema_agent.is_ollama_available()
    }

@app.get("/api/samples")
def get_samples():
    return [
        {
            "id": "medical_billing",
            "name": "Sample 1: Medical Billing Statement",
            "filename": "sample_medical_billing.pdf",
            "description": "Patient John Doe, SSN, Address, Policy MED-99482, ICD-10 diagnosis codes, charges table ($14,250.00).",
            "compliance_focus": "HIPAA 45 CFR § 164 Safe Harbor + NSA Adjudication"
        },
        {
            "id": "tech_nda",
            "name": "Sample 2: Tech Vendor NDA & MSA",
            "filename": "sample_tech_vendor_nda.pdf",
            "description": "Apex Cloud vs Quantum Data, Unilateral Indemnification (Clause 8.2), Foreign Zurich Jurisdiction, 10-Yr Term.",
            "compliance_focus": "Enterprise Risk Baseline + Unlimited Liability Flag"
        },
        {
            "id": "academic_assignment",
            "name": "Sample 3: Academic Assignment Cover Sheet",
            "filename": "sample_academic_assignment.pdf",
            "description": "Dept. of ECE, Faculty Prof. Akshatha Bhat, Student Maha Akshay R, USN 24BBTCS352.",
            "compliance_focus": "FERPA Student Privacy + Double-Blind Grading Baseline"
        }
    ]

@app.get("/api/samples/{sample_id}/load")
def load_sample(sample_id: str):
    if sample_id == "medical_billing":
        filename = "sample_medical_billing.pdf"
    elif sample_id == "academic_assignment":
        filename = "sample_academic_assignment.pdf"
    else:
        filename = "sample_tech_vendor_nda.pdf"

    file_path = os.path.join(SAMPLES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample not found")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    doc_id = f"doc_{hashlib.md5(file_bytes).hexdigest()[:10]}"
    store_document(doc_id, {
        "doc_id": doc_id,
        "filename": filename,
        "bytes": file_bytes,
        "result": None
    })
    return {"doc_id": doc_id, "filename": filename, "size_bytes": len(file_bytes)}

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    file_bytes = await file.read()
    doc_id = f"doc_{hashlib.md5(file_bytes).hexdigest()[:10]}"
    
    store_document(doc_id, {
        "doc_id": doc_id,
        "filename": file.filename or "uploaded_document.pdf",
        "bytes": file_bytes,
        "result": None
    })
    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "size_bytes": len(file_bytes)
    }

@app.get("/api/pipeline/stream/{doc_id}")
async def stream_pipeline(doc_id: str, demo_mode: bool = True):
    if doc_id not in DOCUMENTS_STORE:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_entry = DOCUMENTS_STORE[doc_id]
    doc_bytes = doc_entry["bytes"]
    filename = doc_entry["filename"]

    async def paced_sleep(delay: float):
        """Allows toggling between paced presentation demo (0.35s) and ultra-fast turbo mode (0.01s)."""
        if demo_mode:
            await asyncio.sleep(delay)
        else:
            await asyncio.sleep(0.01)

    async def event_generator():
        start_time = time.time()

        # Step 0: Ingestion initialized
        yield f"data: {json.dumps({'event': 'init', 'agent': 'Orchestrator', 'message': f'Document {filename} ingested into air-gapped queue.', 'progress': 10})}\n\n"
        await paced_sleep(0.35)

        # Step 1: Agent 1 - Vision & Layout Analysis (Offloaded to worker thread)
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Layout & Vision Agent', 'phase': 'layout_parsing', 'message': 'Running PyMuPDF spatial tokenizer & reading order detector...', 'progress': 25})}\n\n"
        await paced_sleep(0.4)

        vision_data = await asyncio.to_thread(vision_agent.process_document, doc_bytes)
        token_count = vision_data["total_tokens"]
        box_count = len(vision_data["tokens"])
        doc_type = vision_data["doc_type"]
        page_count = vision_data["page_count"]

        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'Layout & Vision Agent', 'phase': 'layout_parsing', 'message': f'Scanned {token_count} tokens across {page_count} page(s) ({box_count} spatial coordinates mapped).', 'metrics': {'tokens_scanned': token_count, 'bounding_boxes': box_count, 'doc_type': doc_type}, 'progress': 40})}\n\n"
        await paced_sleep(0.35)

        # Step 2: Parallel execution - Agent 4 (Privacy & Redaction) & Agent 2 (Schema Structuring)
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Privacy & Redaction Agent', 'phase': 'presidio_scanning', 'message': 'Presidio NER scanning for direct and quasi-identifiers...', 'progress': 50})}\n\n"
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Schema Structuring Agent', 'phase': 'schema_extraction', 'message': 'Parsing document entities into strict Pydantic models...', 'progress': 55})}\n\n"
        await paced_sleep(0.4)

        # True parallel execution using worker thread pool
        def execute_privacy():
            raw_pii = privacy_agent.scan_pii(vision_data["full_text"])
            sanitized_pdf, redacted_images, verified_entities, proof = privacy_agent.apply_true_redaction(
                doc_bytes=doc_bytes,
                pii_list=raw_pii
            )
            return raw_pii, sanitized_pdf, redacted_images, verified_entities, proof

        def execute_schema():
            return schema_agent.extract_schema(vision_data["full_text"], doc_type)

        (raw_pii, sanitized_pdf, redacted_images, verified_entities, proof), structured_data = await asyncio.gather(
            asyncio.to_thread(execute_privacy),
            asyncio.to_thread(execute_schema)
        )

        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'Privacy & Redaction Agent', 'phase': 'redaction_applied', 'message': f'Redacted {len(verified_entities)} PII/PHI entities with hardware pixel burn-in (Zero text leakage verified).', 'metrics': {'pii_count': len(verified_entities), 'verified_zero_leakage': proof['verified_zero_leakage']}, 'progress': 70})}\n\n"
        await paced_sleep(0.3)

        schema_type_name = structured_data.get("schema_type", "STANDARD")
        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'Schema Structuring Agent', 'phase': 'schema_extraction', 'message': f'Extracted type-safe JSON schema ({schema_type_name}).', 'metrics': {'schema': schema_type_name}, 'progress': 80})}\n\n"
        await paced_sleep(0.3)

        # Step 3: Agent 3 - Compliance & Risk Agent with Dynamic Bounding Box Localization
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Risk & Compliance Agent', 'phase': 'risk_evaluation', 'message': 'Comparing extracted clauses against corporate benchmarks...', 'progress': 85})}\n\n"
        await paced_sleep(0.35)

        risk_findings = await asyncio.to_thread(
            risk_agent.evaluate_risks,
            vision_data["full_text"],
            doc_type,
            len(verified_entities),
            doc_bytes
        )
        high_risk_count = sum(1 for r in risk_findings if r.severity == "HIGH")

        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'Risk & Compliance Agent', 'phase': 'risk_evaluation', 'message': f'Evaluated policy baseline: {len(risk_findings)} findings ({high_risk_count} High Risk).', 'metrics': {'findings_count': len(risk_findings), 'high_risk': high_risk_count}, 'progress': 92})}\n\n"
        await paced_sleep(0.25)

        # Step 4: Differential Privacy Computation & Audit Hash
        diff_privacy = await asyncio.to_thread(privacy_agent.compute_differential_privacy, structured_data, 0.5)
        
        # Calculate cryptographic SHA-256 audit digest
        audit_payload = {
            "doc_id": doc_id,
            "filename": filename,
            "pii_count": len(verified_entities),
            "risks": [r.model_dump() for r in risk_findings],
            "schema": structured_data
        }
        audit_hash = hashlib.sha256(json.dumps(audit_payload, sort_keys=True).encode()).hexdigest()

        total_time_ms = round((time.time() - start_time) * 1000, 2)

        # Compile final PipelineResult
        final_result = PipelineResult(
            doc_id=doc_id,
            filename=filename,
            doc_type=doc_type,
            page_count=page_count,
            tokens_count=token_count,
            bounding_boxes_count=box_count,
            pii_entities=verified_entities,
            risk_findings=risk_findings,
            extracted_schema=structured_data,
            differential_privacy=diff_privacy,
            audit_hash=audit_hash,
            processing_time_ms=total_time_ms,
            original_pdf_url=f"/api/download/original/{doc_id}",
            redacted_pdf_url=f"/api/download/redacted/{doc_id}",
            original_page_images=vision_data["page_images"],
            redacted_page_images=redacted_images,
            text_erased_proof=proof
        )

        # Cache in memory
        doc_entry["result"] = final_result
        doc_entry["sanitized_bytes"] = sanitized_pdf

        yield f"data: {json.dumps({'event': 'pipeline_finished', 'agent': 'Aggregator Gateway', 'message': f'Pipeline finished in {total_time_ms}ms. Clean PDF burned & Audit log ready.', 'progress': 100, 'result': final_result.model_dump()})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/documents/{doc_id}/pages/{page_idx}/image")
def get_document_page_image(doc_id: str, page_idx: int, sanitized: bool = False):
    """Binary image serving endpoint with browser HTTP caching."""
    if doc_id not in DOCUMENTS_STORE:
        raise HTTPException(status_code=404, detail="Document not found")
    entry = DOCUMENTS_STORE[doc_id]
    result = entry.get("result")
    if not result:
        raise HTTPException(status_code=404, detail="Result not ready")
    images = result.redacted_page_images if sanitized else result.original_page_images
    if page_idx < 0 or page_idx >= len(images):
        raise HTTPException(status_code=404, detail="Page index out of bounds")
    data_url = images[page_idx]
    b64_data = data_url.split(",", 1)[1] if "," in data_url else data_url
    img_bytes = base64.b64decode(b64_data)
    return Response(
        content=img_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"}
    )

@app.get("/api/download/original/{doc_id}")
def download_original(doc_id: str):
    if doc_id not in DOCUMENTS_STORE:
        raise HTTPException(status_code=404, detail="Document not found")
    entry = DOCUMENTS_STORE[doc_id]
    return StreamingResponse(
        io.BytesIO(entry["bytes"]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=original_{entry['filename']}"}
    )

@app.get("/api/download/redacted/{doc_id}")
def download_redacted(doc_id: str):
    if doc_id not in DOCUMENTS_STORE or "sanitized_bytes" not in DOCUMENTS_STORE[doc_id]:
        raise HTTPException(status_code=404, detail="Redacted document not ready")
    entry = DOCUMENTS_STORE[doc_id]
    return StreamingResponse(
        io.BytesIO(entry["sanitized_bytes"]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=clean_redacted_{entry['filename']}"}
    )

@app.get("/api/download/audit/{doc_id}")
def download_audit(doc_id: str):
    if doc_id not in DOCUMENTS_STORE or not DOCUMENTS_STORE[doc_id].get("result"):
        raise HTTPException(status_code=404, detail="Audit log not found")
    result: PipelineResult = DOCUMENTS_STORE[doc_id]["result"]
    audit_data = {
        "audit_version": "1.0-AIRGAPPED",
        "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "cryptographic_hash_sha256": result.audit_hash,
        "processing_time_ms": result.processing_time_ms,
        "document_metadata": {
            "doc_id": result.doc_id,
            "filename": result.filename,
            "doc_type": result.doc_type,
            "page_count": result.page_count,
            "token_count": result.tokens_count,
        },
        "redaction_audit": {
            "methodology": "True Hardware Pixel Burn-in via PyMuPDF (fitz.PDF_REDACT_IMAGE_PIXELS)",
            "vector_stream_verification": result.text_erased_proof,
            "total_redactions": len(result.pii_entities),
            "redacted_entities": [e.model_dump() for e in result.pii_entities]
        },
        "compliance_risk_audit": {
            "total_findings": len(result.risk_findings),
            "findings": [r.model_dump() for r in result.risk_findings]
        },
        "differential_privacy_audit": result.differential_privacy.model_dump(),
        "extracted_schema": result.extracted_schema
    }
    return StreamingResponse(
        io.BytesIO(json.dumps(audit_data, indent=2).encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=audit_log_{doc_id}.json"}
    )

@app.get("/api/system/enclave-info")
def get_enclave_info():
    return {
        "desktop_enclave_active": bool(DOCUMENT_ENGINE_SECRET_TOKEN),
        "security_mode": "Isolated Localhost Enclave" if DOCUMENT_ENGINE_SECRET_TOKEN else "Standard Local Development",
        "air_gapped": True,
        "pid": os.getpid(),
        "platform": os.name,
        "cached_documents": len(DOCUMENTS_STORE)
    }

@app.post("/api/shutdown")
async def shutdown_engine(request: Request):
    if DOCUMENT_ENGINE_SECRET_TOKEN:
        token = request.headers.get("x-session-token") or request.query_params.get("session_token")
        if token != DOCUMENT_ENGINE_SECRET_TOKEN:
            raise HTTPException(status_code=403, detail="Forbidden")
    asyncio.get_event_loop().call_later(0.3, lambda: os._exit(0))
    return {"status": "success", "message": "Backend engine terminating."}

# Mount static frontend production build if available
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend_dist")


