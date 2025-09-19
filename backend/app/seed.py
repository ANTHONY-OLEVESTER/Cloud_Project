from __future__ import annotations

from datetime import datetime, timedelta

from app import models


def demo_records(*, password_hasher) -> list[dict]:
    now = datetime.utcnow()
    user_password = password_hasher("changeme123")

    records: list[dict] = [
        {
            "model": models.User,
            "data": {
                "email": "admin@cloudguard.dev",
                "full_name": "Cloud Guard Admin",
                "hashed_password": user_password,
                "is_active": True,
            },
        },
        {
            "model": models.CloudAccount,
            "data": {
                "provider": models.CloudProvider.AWS,
                "external_id": "123456789012",
                "display_name": "AWS Master",
                "status": models.AccountStatus.CONNECTED,
                "created_at": now - timedelta(days=30),
            },
        },
        {
            "model": models.CloudAccount,
            "data": {
                "provider": models.CloudProvider.AZURE,
                "external_id": "contoso-root",
                "display_name": "Azure Root",
                "status": models.AccountStatus.PENDING,
                "created_at": now - timedelta(days=12),
            },
        },
        {
            "model": models.CloudAccount,
            "data": {
                "provider": models.CloudProvider.GCP,
                "external_id": "gcp-org",
                "display_name": "GCP Organization",
                "status": models.AccountStatus.ERROR,
                "created_at": now - timedelta(days=7),
            },
        },
        {
            "model": models.Policy,
            "data": {
                "provider": models.CloudProvider.AWS,
                "name": "Root MFA Enabled",
                "control_id": "AWS-SEC-001",
                "category": "Identity",
                "severity": models.PolicySeverity.CRITICAL,
                "description": "Ensure root account has MFA enabled.",
            },
        },
        {
            "model": models.Policy,
            "data": {
                "provider": models.CloudProvider.AWS,
                "name": "S3 Public Buckets",
                "control_id": "AWS-STO-010",
                "category": "Storage",
                "severity": models.PolicySeverity.HIGH,
                "description": "Disallow public S3 buckets.",
            },
        },
        {
            "model": models.Policy,
            "data": {
                "provider": models.CloudProvider.AZURE,
                "name": "Secure Score >= 70",
                "control_id": "AZU-SEC-070",
                "category": "Governance",
                "severity": models.PolicySeverity.MEDIUM,
                "description": "Maintain Azure secure score of at least 70.",
            },
        },
        {
            "model": models.Policy,
            "data": {
                "provider": models.CloudProvider.GCP,
                "name": "CIS 1.1 Root Accounts",
                "control_id": "GCP-CIS-1.1",
                "category": "Identity",
                "severity": models.PolicySeverity.HIGH,
                "description": "Ensure no active root accounts exist.",
            },
        },
        {
            "model": models.PolicyEvaluation,
            "data": {
                "policy_id": 1,
                "account_id": 1,
                "status": models.ComplianceStatus.NON_COMPLIANT,
                "findings": "Root account missing MFA.",
                "last_checked_at": now - timedelta(days=1),
            },
        },
        {
            "model": models.PolicyEvaluation,
            "data": {
                "policy_id": 2,
                "account_id": 1,
                "status": models.ComplianceStatus.COMPLIANT,
                "findings": "All buckets private.",
                "last_checked_at": now - timedelta(hours=5),
            },
        },
        {
            "model": models.PolicyEvaluation,
            "data": {
                "policy_id": 3,
                "account_id": 2,
                "status": models.ComplianceStatus.UNKNOWN,
                "findings": "Awaiting latest secure score scan.",
                "last_checked_at": now - timedelta(days=2),
            },
        },
        {
            "model": models.PolicyEvaluation,
            "data": {
                "policy_id": 4,
                "account_id": 3,
                "status": models.ComplianceStatus.NON_COMPLIANT,
                "findings": "Root project user detected.",
                "last_checked_at": now - timedelta(hours=16),
            },
        },
        {
            "model": models.Notification,
            "data": {
                "title": "Critical policy violation",
                "message": "AWS Root MFA Enabled is failing on account 123456789012.",
                "type": models.NotificationType.POLICY_VIOLATION,
                "created_at": now - timedelta(hours=2, minutes=15),
            },
        },
        {
            "model": models.Notification,
            "data": {
                "title": "Azure connector pending",
                "message": "Azure Root is waiting for admin consent to finalize the sync.",
                "type": models.NotificationType.ACCOUNT_SYNC,
                "created_at": now - timedelta(hours=1, minutes=5),
            },
        },
        {
            "model": models.Notification,
            "data": {
                "title": "New compliance report ready",
                "message": "Download the latest tri-cloud readiness assessment from the reports area.",
                "type": models.NotificationType.BUILD_COMPLETE,
                "created_at": now - timedelta(minutes=25),
            },
        },
    ]

    return records






