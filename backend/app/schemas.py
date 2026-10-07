from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float
    page: int = 0
    text: str = ""

class PIIEntity(BaseModel):
    id: str
    entity_type: str
    text: str
    score: float
    bbox: List[float] = Field(default_factory=list, description="[x0, y0, x1, y1]")
    page: int = 0
    category: str = "direct" # direct identifier or quasi identifier
    explanation: Optional[str] = None

class RiskFinding(BaseModel):
    clause_id: str
    clause_title: str
    severity: str # "HIGH", "MEDIUM", "LOW"
    flagged_text: str
    risk_explanation: str
    policy_benchmark: str
    suggested_revision: str

class DifferentialPrivacyMetrics(BaseModel):
    k_anonymity_level: str
    epsilon: float
    global_sensitivity: float
    laplace_noise: float
    original_aggregate: float
    privatized_aggregate: float
    guarantee: str

class PipelineEvent(BaseModel):
    agent_id: str
    agent_name: str
    phase: str
    status: str # "started", "progress", "completed", "warning"
    message: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str

class PipelineResult(BaseModel):
    doc_id: str
    filename: str
    doc_type: str
    page_count: int
    tokens_count: int
    bounding_boxes_count: int
    pii_entities: List[PIIEntity]
    risk_findings: List[RiskFinding]
    extracted_schema: Dict[str, Any]
    differential_privacy: DifferentialPrivacyMetrics
    audit_hash: str
    processing_time_ms: float
    original_pdf_url: str
    redacted_pdf_url: str
    original_page_images: List[str] # base64 data URLs
    redacted_page_images: List[str] # base64 data URLs
    text_erased_proof: Dict[str, Any]
