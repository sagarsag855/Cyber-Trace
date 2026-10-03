from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.database import engine
from backend.models import Base, CaseModel, EvidenceModel


app = FastAPI(
    title="CyberTrace",
    description="Digital Forensics & Incident Investigation Platform",
    version="1.0.0"
)


# =========================================
# DATABASE
# =========================================

Base.metadata.create_all(bind=engine)


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# CASE DATA MODEL
# =========================================

class Case(BaseModel):
    case_name: str
    description: str
    investigator: str
    priority: str

class Evidence(BaseModel):
    case_id: int
    evidence_name: str
    evidence_type: str
    collected_by: str
    collected_at: str
    sha256_hash: str
    status: str
    notes: str | None = None

# =========================================
# HOME
# =========================================

@app.get("/")
def home():
    return {
        "application": "CyberTrace",
        "status": "online",
        "message": "CyberTrace backend is running"
    }


# =========================================
# CREATE CASE
# =========================================

@app.post("/cases")
def create_case(case: Case):

    new_case = CaseModel(
        case_name=case.case_name,
        description=case.description,
        investigator=case.investigator,
        priority=case.priority
    )

    from backend.database import SessionLocal

    db = SessionLocal()

    try:
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        return {
            "status": "success",
            "message": "Investigation created",
            "case": {
                "id": new_case.id,
                "case_name": new_case.case_name,
                "description": new_case.description,
                "investigator": new_case.investigator,
                "priority": new_case.priority
            }
        }

    finally:
        db.close()

        # =========================================
# GET ALL CASES
# =========================================

@app.get("/cases")
def get_cases():

    from backend.database import SessionLocal

    db = SessionLocal()

    try:

        cases = db.query(CaseModel).order_by(
            CaseModel.id.desc()
        ).all()

        return {
            "status": "success",
            "cases": [
                {
                    "id": case.id,
                    "case_name": case.case_name,
                    "description": case.description,
                    "investigator": case.investigator,
                    "priority": case.priority
                }
                for case in cases
            ]
        }

    finally:

        db.close()

# =========================================
# EVIDENCE MANAGEMENT
# =========================================

@app.post("/evidence")
def create_evidence(evidence: Evidence):

    from backend.database import SessionLocal

    db = SessionLocal()

    try:
        case = db.query(CaseModel).filter(
            CaseModel.id == evidence.case_id
        ).first()

        if not case:
            return {
                "status": "error",
                "message": "Investigation not found."
            }

        new_evidence = EvidenceModel(
            case_id=evidence.case_id,
            evidence_name=evidence.evidence_name,
            evidence_type=evidence.evidence_type,
            collected_by=evidence.collected_by,
            collected_at=evidence.collected_at,
            sha256_hash=evidence.sha256_hash,
            status=evidence.status,
            notes=evidence.notes
        )

        db.add(new_evidence)
        db.commit()
        db.refresh(new_evidence)

        return {
            "status": "success",
            "message": "Evidence added successfully.",
            "evidence": {
                "id": new_evidence.id,
                "case_id": new_evidence.case_id,
                "evidence_name": new_evidence.evidence_name,
                "evidence_type": new_evidence.evidence_type,
                "collected_by": new_evidence.collected_by,
                "collected_at": new_evidence.collected_at,
                "sha256_hash": new_evidence.sha256_hash,
                "status": new_evidence.status,
                "notes": new_evidence.notes
            }
        }

    finally:
        db.close()


@app.get("/evidence/{case_id}")
def get_evidence(case_id: int):

    from backend.database import SessionLocal

    db = SessionLocal()

    try:
        evidence_items = db.query(
            EvidenceModel
        ).filter(
            EvidenceModel.case_id == case_id
        ).order_by(
            EvidenceModel.id.desc()
        ).all()

        return {
            "status": "success",
            "case_id": case_id,
            "evidence": [
                {
                    "id": item.id,
                    "case_id": item.case_id,
                    "evidence_name": item.evidence_name,
                    "evidence_type": item.evidence_type,
                    "collected_by": item.collected_by,
                    "collected_at": item.collected_at,
                    "sha256_hash": item.sha256_hash,
                    "status": item.status,
                    "notes": item.notes
                }
                for item in evidence_items
            ]
        }

    finally:
        db.close()