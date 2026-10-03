from sqlalchemy import Column, Integer, String, Text, ForeignKey
from backend.database import Base


class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    investigator = Column(String(100), nullable=False)
    priority = Column(String(20), nullable=False)


class EvidenceModel(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(
        Integer,
        ForeignKey("cases.id"),
        nullable=False
    )

    evidence_name = Column(
        String(200),
        nullable=False
    )

    evidence_type = Column(
        String(100),
        nullable=False
    )

    collected_by = Column(
        String(100),
        nullable=False
    )

    collected_at = Column(
        String(100),
        nullable=False
    )

    sha256_hash = Column(
        String(64),
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False
    )

    notes = Column(
        Text,
        nullable=True
    )