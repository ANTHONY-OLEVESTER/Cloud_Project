from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import (
    AccountStatus,
    CloudProvider,
    ComplianceStatus,
    NotificationType,
    PolicySeverity,
)


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Account schemas
class AccountBase(BaseModel):
    provider: CloudProvider
    external_id: str = Field(min_length=2, max_length=255)
    display_name: str = Field(min_length=2, max_length=255)
    status: AccountStatus = AccountStatus.PENDING


class AccountCreate(AccountBase):
    owner_id: Optional[int] = None


class AccountUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    status: Optional[AccountStatus] = None


class AccountRead(AccountBase):
    id: int
    owner_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class AccountSummary(BaseModel):
    id: int
    provider: CloudProvider
    display_name: str
    external_id: str

    class Config:
        from_attributes = True


# Policy schemas
class PolicyBase(BaseModel):
    provider: CloudProvider
    name: str = Field(min_length=2, max_length=255)
    control_id: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=255)
    severity: PolicySeverity = PolicySeverity.MEDIUM
    description: Optional[str] = None


class PolicyCreate(PolicyBase):
    pass


class PolicyUpdate(BaseModel):
    provider: Optional[CloudProvider] = None
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    control_id: Optional[str] = Field(default=None, min_length=2, max_length=255)
    category: Optional[str] = Field(default=None, min_length=2, max_length=255)
    severity: Optional[PolicySeverity] = None
    description: Optional[str] = None


class PolicyRead(PolicyBase):
    id: int

    class Config:
        from_attributes = True


class PolicySummary(BaseModel):
    id: int
    name: str
    control_id: str
    provider: CloudProvider

    class Config:
        from_attributes = True


# Evaluation schemas
class EvaluationBase(BaseModel):
    status: ComplianceStatus = ComplianceStatus.UNKNOWN
    findings: Optional[str] = None


class EvaluationCreate(EvaluationBase):
    policy_id: int
    account_id: int


class EvaluationUpdate(EvaluationBase):
    pass


class EvaluationRead(EvaluationBase):
    id: int
    policy_id: int
    account_id: int
    last_checked_at: datetime
    policy: Optional[PolicySummary] = None
    account: Optional[AccountSummary] = None

    class Config:
        from_attributes = True


# Dashboard schemas
class ComplianceSummary(BaseModel):
    total_policies: int
    compliant: int
    non_compliant: int
    unknown: int


class ProviderBreakdown(BaseModel):
    provider: CloudProvider
    accounts: int
    compliant: int
    non_compliant: int
    unknown: int


class DashboardSnapshot(BaseModel):
    summary: ComplianceSummary
    providers: list[ProviderBreakdown]


# Notification schemas
class NotificationBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2)
    type: NotificationType = NotificationType.BROADCAST


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
