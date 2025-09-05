"""
Alert Service for Insurance Document Management System

Provides alerting capabilities for policy expiration warnings,
document processing errors, and system notifications.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class AlertType(Enum):
    """Types of alerts the system can generate"""
    POLICY_EXPIRING = "policy_expiring"
    POLICY_EXPIRED = "policy_expired"
    POLICY_MISSING_INFO = "policy_missing_info"
    PROCESSING_ERROR = "processing_error"
    LOW_CONFIDENCE = "low_confidence"
    SYSTEM_WARNING = "system_warning"
    DUPLICATE_POLICY = "duplicate_policy"


class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Alert:
    """Alert data structure"""
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    policy_id: Optional[int] = None
    property_id: Optional[int] = None
    created_at: datetime = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: bool = True
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary for API responses"""
        return {
            "id": self.id,
            "type": self.type.value,
            "severity": self.severity.value,
            "title": self.title,
            "message": self.message,
            "policy_id": self.policy_id,
            "property_id": self.property_id,
            "created_at": self.created_at.isoformat() + "Z",
            "metadata": self.metadata,
            "is_active": self.is_active
        }


class AlertService:
    """Service for managing alerts and notifications"""
    
    def __init__(self):
        self._alerts: List[Alert] = []
        self._alert_counter = 0
    
    def check_policy_alerts(self, policy_file) -> List[Dict[str, Any]]:
        """
        Check a policy file for potential alerts
        
        Args:
            policy_file: PolicyFile model instance
            
        Returns:
            List of alert dictionaries
        """
        alerts = []
        
        try:
            # Check for expiration alerts
            expiration_alerts = self._check_expiration_alerts(policy_file)
            alerts.extend(expiration_alerts)
            
            # Check for missing information
            missing_info_alerts = self._check_missing_info_alerts(policy_file)
            alerts.extend(missing_info_alerts)
            
            # Check for low confidence parsing
            confidence_alerts = self._check_confidence_alerts(policy_file)
            alerts.extend(confidence_alerts)
            
            # Store alerts
            for alert_data in alerts:
                alert = Alert(
                    id=self._generate_alert_id(),
                    type=AlertType(alert_data["type"]),
                    severity=AlertSeverity(alert_data["severity"]),
                    title=alert_data["title"],
                    message=alert_data["message"],
                    policy_id=policy_file.id,
                    property_id=policy_file.property_id,
                    metadata=alert_data.get("metadata", {})
                )
                self._alerts.append(alert)
            
            # Return as dictionaries
            return [alert.to_dict() for alert in alerts[-len(alerts):]]
            
        except Exception as e:
            logger.error(f"Error checking policy alerts for {policy_file.id}: {e}")
            return []
    
    def _check_expiration_alerts(self, policy_file) -> List[Dict[str, Any]]:
        """Check for policy expiration alerts"""
        alerts = []
        
        if not policy_file.expiration_date:
            return alerts
        
        today = date.today()
        expiration_date = policy_file.expiration_date
        
        # Convert datetime to date if necessary
        if isinstance(expiration_date, datetime):
            expiration_date = expiration_date.date()
        
        days_until_expiration = (expiration_date - today).days
        
        # Policy expired
        if days_until_expiration < 0:
            alerts.append({
                "type": AlertType.POLICY_EXPIRED.value,
                "severity": AlertSeverity.CRITICAL.value,
                "title": "Policy Expired",
                "message": f"Policy {policy_file.policy_number or 'Unknown'} expired {abs(days_until_expiration)} days ago",
                "metadata": {
                    "expiration_date": expiration_date.isoformat(),
                    "days_overdue": abs(days_until_expiration)
                }
            })
        
        # Policy expiring soon
        elif days_until_expiration <= 30:
            severity = AlertSeverity.HIGH if days_until_expiration <= 7 else AlertSeverity.MEDIUM
            
            alerts.append({
                "type": AlertType.POLICY_EXPIRING.value,
                "severity": severity.value,
                "title": "Policy Expiring Soon",
                "message": f"Policy {policy_file.policy_number or 'Unknown'} expires in {days_until_expiration} days",
                "metadata": {
                    "expiration_date": expiration_date.isoformat(),
                    "days_until_expiration": days_until_expiration
                }
            })
        
        return alerts
    
    def _check_missing_info_alerts(self, policy_file) -> List[Dict[str, Any]]:
        """Check for missing critical information"""
        alerts = []
        missing_fields = []
        
        # Check for critical missing fields
        if not policy_file.policy_number:
            missing_fields.append("policy_number")
        
        if not policy_file.carrier:
            missing_fields.append("carrier")
        
        if not policy_file.coverage_type:
            missing_fields.append("coverage_type")
        
        if not policy_file.effective_date:
            missing_fields.append("effective_date")
        
        if not policy_file.expiration_date:
            missing_fields.append("expiration_date")
        
        if missing_fields:
            alerts.append({
                "type": AlertType.POLICY_MISSING_INFO.value,
                "severity": AlertSeverity.MEDIUM.value,
                "title": "Missing Policy Information",
                "message": f"Policy is missing: {', '.join(missing_fields)}",
                "metadata": {
                    "missing_fields": missing_fields,
                    "total_missing": len(missing_fields)
                }
            })
        
        return alerts
    
    def _check_confidence_alerts(self, policy_file) -> List[Dict[str, Any]]:
        """Check for low confidence parsing alerts"""
        alerts = []
        
        confidence_threshold = 0.5  # 50% threshold
        
        if policy_file.confidence_score is not None and policy_file.confidence_score < confidence_threshold:
            severity = AlertSeverity.HIGH if policy_file.confidence_score < 0.3 else AlertSeverity.MEDIUM
            
            alerts.append({
                "type": AlertType.LOW_CONFIDENCE.value,
                "severity": severity.value,
                "title": "Low Parsing Confidence",
                "message": f"Document parsing confidence is {policy_file.confidence_score:.1%}. Manual review recommended.",
                "metadata": {
                    "confidence_score": policy_file.confidence_score,
                    "threshold": confidence_threshold,
                    "recommendation": "manual_review"
                }
            })
        
        return alerts
    
    def add_processing_error_alert(self, error_message: str, policy_id: Optional[int] = None, 
                                 file_name: Optional[str] = None) -> str:
        """Add a processing error alert"""
        alert = Alert(
            id=self._generate_alert_id(),
            type=AlertType.PROCESSING_ERROR,
            severity=AlertSeverity.HIGH,
            title="Document Processing Error",
            message=f"Error processing {file_name or 'document'}: {error_message}",
            policy_id=policy_id,
            metadata={
                "error_message": error_message,
                "file_name": file_name
            }
        )
        
        self._alerts.append(alert)
        logger.warning(f"Processing error alert created: {alert.id}")
        return alert.id
    
    def add_system_warning(self, title: str, message: str, metadata: Optional[Dict] = None) -> str:
        """Add a system warning alert"""
        alert = Alert(
            id=self._generate_alert_id(),
            type=AlertType.SYSTEM_WARNING,
            severity=AlertSeverity.MEDIUM,
            title=title,
            message=message,
            metadata=metadata or {}
        )
        
        self._alerts.append(alert)
        logger.info(f"System warning alert created: {alert.id}")
        return alert.id
    
    def get_all_alerts(self, alert_type: Optional[str] = None, 
                      active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get all alerts with optional filtering
        
        Args:
            alert_type: Filter by alert type
            active_only: Only return active alerts
            
        Returns:
            List of alert dictionaries
        """
        filtered_alerts = self._alerts.copy()
        
        # Filter by active status
        if active_only:
            filtered_alerts = [a for a in filtered_alerts if a.is_active]
        
        # Filter by type
        if alert_type:
            try:
                alert_type_enum = AlertType(alert_type)
                filtered_alerts = [a for a in filtered_alerts if a.type == alert_type_enum]
            except ValueError:
                logger.warning(f"Invalid alert type for filtering: {alert_type}")
        
        # Sort by created_at (newest first)
        filtered_alerts.sort(key=lambda x: x.created_at, reverse=True)
        
        return [alert.to_dict() for alert in filtered_alerts]
    
    def get_alerts_for_policy(self, policy_id: int, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all alerts for a specific policy"""
        filtered_alerts = [a for a in self._alerts if a.policy_id == policy_id]
        
        if active_only:
            filtered_alerts = [a for a in filtered_alerts if a.is_active]
        
        filtered_alerts.sort(key=lambda x: x.created_at, reverse=True)
        
        return [alert.to_dict() for alert in filtered_alerts]
    
    def dismiss_alert(self, alert_id: str) -> bool:
        """Dismiss (deactivate) an alert"""
        for alert in self._alerts:
            if alert.id == alert_id:
                alert.is_active = False
                logger.info(f"Alert {alert_id} dismissed")
                return True
        
        logger.warning(f"Alert {alert_id} not found for dismissal")
        return False
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get a summary of alert statistics"""
        active_alerts = [a for a in self._alerts if a.is_active]
        
        # Count by type
        type_counts = {}
        for alert in active_alerts:
            alert_type = alert.type.value
            type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
        
        # Count by severity
        severity_counts = {}
        for alert in active_alerts:
            severity = alert.severity.value
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total_active": len(active_alerts),
            "total_all": len(self._alerts),
            "by_type": type_counts,
            "by_severity": severity_counts,
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }
    
    def cleanup_old_alerts(self, days_old: int = 30):
        """Remove alerts older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        initial_count = len(self._alerts)
        self._alerts = [a for a in self._alerts if a.created_at > cutoff_date]
        removed_count = initial_count - len(self._alerts)
        
        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} old alerts")
        
        return removed_count
    
    def _generate_alert_id(self) -> str:
        """Generate a unique alert ID"""
        self._alert_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"alert_{timestamp}_{self._alert_counter:04d}"
