from __future__ import annotations

from datetime import datetime, date
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


class CloudAccountCreate(BaseModel):
    """Schema for creating a new cloud account connection."""
    display_name: str = Field(..., min_length=1, max_length=255)
    provider: str = Field(..., pattern="^(aws|azure|gcp)$")
    external_id: str = Field(..., min_length=1, max_length=255)
    access_method: str = Field(..., min_length=1, max_length=100)
    credential: Optional[str] = Field(None, max_length=2000)
    service_email: Optional[str] = Field(None, max_length=255)
    tenant_id: Optional[str] = Field(None, max_length=255)
    sync_frequency: str = Field(default="Daily", pattern="^(Daily|Weekly|Hourly|Manual)$")
    auto_sync: bool = Field(default=True)

    class Config:
        json_schema_extra = {
            "example": {
                "display_name": "Production AWS",
                "provider": "aws",
                "external_id": "123456789012",
                "access_method": "IAM Role",
                "credential": "arn:aws:iam::123456789012:role/CloudGuardRole",
                "service_email": "service-account@example.com",
                "tenant_id": "o-1234567890",
                "sync_frequency": "Daily",
                "auto_sync": True
            }
        }


class CloudAccountUpdate(BaseModel):
    """Schema for updating an existing cloud account."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, pattern="^(connected|pending|error)$")
    access_method: Optional[str] = Field(None, max_length=100)
    credential: Optional[str] = Field(None, max_length=2000)
    service_email: Optional[str] = Field(None, max_length=255)
    tenant_id: Optional[str] = Field(None, max_length=255)
    sync_frequency: Optional[str] = Field(None, pattern="^(Daily|Weekly|Hourly|Manual)$")
    auto_sync: Optional[bool] = None


class CloudAccountResponse(BaseModel):
    """Schema for cloud account response."""
    id: int
    provider: str
    external_id: str
    display_name: str
    status: str
    access_method: Optional[str] = None
    service_email: Optional[str] = None
    tenant_id: Optional[str] = None
    sync_frequency: str
    auto_sync: bool
    last_synced_at: Optional[datetime] = None
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===========================
# Policy Schemas
# ===========================

class PolicyCreate(BaseModel):
    """Schema for creating a new policy."""
    name: str = Field(..., min_length=1, max_length=255)
    control_id: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=255)
    provider: str = Field(..., pattern="^(aws|azure|gcp)$")
    severity: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    description: Optional[str] = None
    
    # Extended fields
    policy_type: Optional[str] = Field(None, max_length=100)
    scope_level: Optional[str] = Field(None, max_length=100)
    scope_name: Optional[str] = Field(None, max_length=255)
    scope_id: Optional[str] = Field(None, max_length=255)
    compliance_status: str = Field(default="unknown", pattern="^(compliant|non_compliant|warning|unknown)$")
    affected_resources: int = Field(default=0, ge=0)
    last_reviewed: Optional[date] = None
    policy_content: Optional[str] = None
    tags: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Prevent Public S3 Buckets",
                "control_id": "CIS-AWS-1.2.3",
                "category": "Storage Security",
                "provider": "aws",
                "severity": "high",
                "description": "Ensures S3 buckets are not publicly accessible",
                "policy_type": "SCP (Service Control Policy)",
                "scope_level": "Organizational Unit",
                "scope_name": "Production OU",
                "scope_id": "ou-xxxx-xxxxxxxx",
                "compliance_status": "compliant",
                "affected_resources": 0,
                "policy_content": '{"Version": "2012-10-17", "Statement": [{"Effect": "Deny"}]}',
                "tags": "security, compliance, s3, storage"
            }
        }


class PolicyUpdate(BaseModel):
    """Schema for updating an existing policy."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    control_id: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=255)
    severity: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    description: Optional[str] = None
    
    # Extended fields
    policy_type: Optional[str] = Field(None, max_length=100)
    scope_level: Optional[str] = Field(None, max_length=100)
    scope_name: Optional[str] = Field(None, max_length=255)
    scope_id: Optional[str] = Field(None, max_length=255)
    compliance_status: Optional[str] = Field(None, pattern="^(compliant|non_compliant|warning|unknown)$")
    affected_resources: Optional[int] = Field(None, ge=0)
    last_reviewed: Optional[date] = None
    policy_content: Optional[str] = None
    tags: Optional[str] = Field(None, max_length=500)


class PolicyRead(BaseModel):
    """Schema for policy response."""
    id: int
    provider: str
    name: str
    control_id: str
    category: str
    severity: str
    description: Optional[str] = None
    
    # Extended fields
    policy_type: Optional[str] = None
    scope_level: Optional[str] = None
    scope_name: Optional[str] = None
    scope_id: Optional[str] = None
    compliance_status: str
    affected_resources: int
    last_reviewed: Optional[date] = None
    policy_content: Optional[str] = None
    tags: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===========================
# Policy Evaluation Schemas
# ===========================

class EvaluationCreate(BaseModel):
    """Schema for creating a policy evaluation."""
    policy_id: int
    account_id: int
    status: str = Field(default="unknown", pattern="^(compliant|non_compliant|warning|unknown)$")
    findings: Optional[str] = None
    resource_id: Optional[str] = Field(None, max_length=255)


class EvaluationUpdate(BaseModel):
    """Schema for updating a policy evaluation."""
    status: Optional[str] = Field(None, pattern="^(compliant|non_compliant|warning|unknown)$")
    findings: Optional[str] = None
    resource_id: Optional[str] = Field(None, max_length=255)


class EvaluationRead(BaseModel):
    """Schema for policy evaluation response."""
    id: int
    policy_id: int
    account_id: int
    status: str
    last_checked_at: datetime
    findings: Optional[str] = None
    resource_id: Optional[str] = None

    class Config:
        from_attributes = True


# ===========================
# Notification Schemas
# ===========================

class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    type: str = Field(
        default="broadcast",
        pattern="^(policy_violation|account_sync|build_complete|provisioning|broadcast)$"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Account Connected",
                "message": "Production AWS has been successfully connected",
                "type": "build_complete"
            }
        }


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===========================
# User Schemas
# ===========================

class UserCreate(BaseModel):
    """Schema for creating a user."""
    email: str = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True