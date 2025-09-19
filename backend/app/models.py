from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CloudProvider(str, enum.Enum):
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"


class AccountStatus(str, enum.Enum):
    CONNECTED = "connected"
    PENDING = "pending"
    ERROR = "error"


class PolicySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    UNKNOWN = "unknown"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    accounts: Mapped[list[CloudAccount]] = relationship(
        "CloudAccount", back_populates="owner", cascade="all, delete-orphan"
    )


class CloudAccount(Base):
    __tablename__ = "cloud_accounts"
    __table_args__ = (UniqueConstraint("provider", "external_id", name="uq_provider_account"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider: Mapped[CloudProvider] = mapped_column(Enum(CloudProvider), index=True)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[AccountStatus] = mapped_column(Enum(AccountStatus), default=AccountStatus.PENDING)
    owner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User | None] = relationship("User", back_populates="accounts")
    evaluations: Mapped[list[PolicyEvaluation]] = relationship(
        "PolicyEvaluation", back_populates="account", cascade="all, delete-orphan"
    )


class Policy(Base):
    __tablename__ = "policies"
    __table_args__ = (UniqueConstraint("provider", "control_id", name="uq_policy_provider_control"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider: Mapped[CloudProvider] = mapped_column(Enum(CloudProvider), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    control_id: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[PolicySeverity] = mapped_column(Enum(PolicySeverity), default=PolicySeverity.MEDIUM)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    evaluations: Mapped[list[PolicyEvaluation]] = relationship(
        "PolicyEvaluation", back_populates="policy", cascade="all, delete-orphan"
    )


class PolicyEvaluation(Base):
    __tablename__ = "policy_evaluations"
    __table_args__ = (UniqueConstraint("policy_id", "account_id", name="uq_policy_account"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    policy_id: Mapped[int] = mapped_column(Integer, ForeignKey("policies.id"), nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("cloud_accounts.id"), nullable=False)
    status: Mapped[ComplianceStatus] = mapped_column(Enum(ComplianceStatus), default=ComplianceStatus.UNKNOWN)
    last_checked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    findings: Mapped[str | None] = mapped_column(Text, nullable=True)

    policy: Mapped[Policy] = relationship("Policy", back_populates="evaluations")
    account: Mapped[CloudAccount] = relationship("CloudAccount", back_populates="evaluations")
