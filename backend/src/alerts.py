"""
Email alerts and scheduling service
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
import schedule
import time
from threading import Thread

from database import SessionLocal
from models import Policy, Alert, Building, Agent

load_dotenv()
logger = logging.getLogger(__name__)

class EmailService:
    """SMTP email service for alerts"""
    
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_username)
        self.enabled = all([self.smtp_host, self.smtp_username, self.smtp_password])
        
        if not self.enabled:
            logger.warning("Email service not configured. Email alerts will be disabled.")
    
    def send_email(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
        """Send an email"""
        if not self.enabled:
            logger.warning("Email service not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add plain text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_test_email(self, to_email: str) -> Dict[str, Any]:
        """Send a test email to verify configuration"""
        if not self.enabled:
            return {
                "success": False,
                "error": "Email service not configured",
                "message": "Please configure SMTP settings in .env file"
            }
        
        subject = "Insurance Master - Test Email"
        body = """
        This is a test email from Insurance Master.
        
        If you received this email, your email configuration is working correctly.
        
        --
        Insurance Master System
        """
        
        html_body = """
        <html>
        <body>
            <h2>Insurance Master - Test Email</h2>
            <p>This is a test email from Insurance Master.</p>
            <p>If you received this email, your email configuration is working correctly.</p>
            <hr>
            <p><em>Insurance Master System</em></p>
        </body>
        </html>
        """
        
        success = self.send_email(to_email, subject, body, html_body)
        
        return {
            "success": success,
            "message": "Test email sent successfully" if success else "Failed to send test email"
        }

class AlertService:
    """Alert management and scheduling service"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.db = SessionLocal()
        self.running = False
        self.scheduler_thread = None
    
    def check_policy_renewals(self) -> List[Dict[str, Any]]:
        """Check for policies that need renewal alerts"""
        try:
            today = datetime.now().date()
            thirty_days = today + timedelta(days=30)
            
            # Find policies expiring in the next 30 days
            expiring_policies = self.db.query(Policy).filter(
                Policy.expiration_date <= thirty_days.isoformat(),
                Policy.expiration_date >= today.isoformat(),
                Policy.status.in_(["active", "expiring-soon"])
            ).all()
            
            alerts_created = []
            
            for policy in expiring_policies:
                # Check if alert already exists
                existing_alert = self.db.query(Alert).filter(
                    Alert.policy_id == policy.id,
                    Alert.alert_type == "renewal"
                ).first()
                
                if existing_alert:
                    continue
                
                # Calculate days until expiration
                exp_date = datetime.fromisoformat(policy.expiration_date).date()
                days_until_exp = (exp_date - today).days
                
                # Determine priority based on days
                if days_until_exp <= 7:
                    priority = "high"
                elif days_until_exp <= 15:
                    priority = "medium"
                else:
                    priority = "low"
                
                # Get building info
                building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                building_name = building.name if building else "Unknown Building"
                
                # Create alert
                message = f"Policy {policy.policy_number} for {building_name} expires in {days_until_exp} days"
                
                alert = Alert(
                    policy_id=policy.id,
                    alert_type="renewal",
                    message=message,
                    priority=priority
                )
                
                self.db.add(alert)
                alerts_created.append({
                    "policy_id": policy.id,
                    "policy_number": policy.policy_number,
                    "building_name": building_name,
                    "days_until_expiration": days_until_exp,
                    "priority": priority,
                    "message": message
                })
            
            self.db.commit()
            
            if alerts_created:
                logger.info(f"Created {len(alerts_created)} renewal alerts")
            
            return alerts_created
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error checking policy renewals: {e}")
            return []
    
    def send_renewal_alerts(self) -> Dict[str, Any]:
        """Send email alerts for unsent renewal notifications"""
        if not self.email_service.enabled:
            return {
                "success": False,
                "message": "Email service not configured",
                "alerts_sent": 0
            }
        
        try:
            # Get unsent high priority alerts
            unsent_alerts = self.db.query(Alert).filter(
                Alert.is_sent == False,
                Alert.alert_type == "renewal",
                Alert.priority.in_(["high", "medium"])
            ).all()
            
            alerts_sent = 0
            
            for alert in unsent_alerts:
                # Get policy and related info
                policy = self.db.query(Policy).filter(Policy.id == alert.policy_id).first()
                if not policy:
                    continue
                
                building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                agent = self.db.query(Agent).filter(Agent.id == policy.agent_id).first()
                
                if not agent or not agent.email:
                    continue
                
                # Compose email
                subject = f"URGENT: Policy Renewal Required - {policy.policy_number}"
                
                body = f"""
                Dear {agent.name},
                
                This is an automated reminder that the following policy requires immediate attention:
                
                Policy Number: {policy.policy_number}
                Property: {building.name if building else 'Unknown'}
                Address: {building.address if building else 'Unknown'}
                Carrier: {policy.carrier}
                Coverage Type: {policy.coverage_type}
                Expiration Date: {policy.expiration_date}
                
                Priority: {alert.priority.upper()}
                Message: {alert.message}
                
                Please take appropriate action to ensure continuous coverage.
                
                Best regards,
                Insurance Master System
                """
                
                html_body = f"""
                <html>
                <body>
                    <h2>Policy Renewal Alert</h2>
                    <p>Dear {agent.name},</p>
                    
                    <p>This is an automated reminder that the following policy requires immediate attention:</p>
                    
                    <table border="1" cellpadding="8" cellspacing="0">
                        <tr><td><strong>Policy Number</strong></td><td>{policy.policy_number}</td></tr>
                        <tr><td><strong>Property</strong></td><td>{building.name if building else 'Unknown'}</td></tr>
                        <tr><td><strong>Address</strong></td><td>{building.address if building else 'Unknown'}</td></tr>
                        <tr><td><strong>Carrier</strong></td><td>{policy.carrier}</td></tr>
                        <tr><td><strong>Coverage Type</strong></td><td>{policy.coverage_type}</td></tr>
                        <tr><td><strong>Expiration Date</strong></td><td>{policy.expiration_date}</td></tr>
                        <tr><td><strong>Priority</strong></td><td style="color: {'red' if alert.priority == 'high' else 'orange'}">{alert.priority.upper()}</td></tr>
                    </table>
                    
                    <p><strong>Message:</strong> {alert.message}</p>
                    
                    <p>Please take appropriate action to ensure continuous coverage.</p>
                    
                    <hr>
                    <p><em>Insurance Master System</em></p>
                </body>
                </html>
                """
                
                # Send email
                if self.email_service.send_email(agent.email, subject, body, html_body):
                    alert.is_sent = True
                    alerts_sent += 1
                    logger.info(f"Sent renewal alert for policy {policy.policy_number} to {agent.email}")
            
            self.db.commit()
            
            return {
                "success": True,
                "message": f"Sent {alerts_sent} renewal alerts",
                "alerts_sent": alerts_sent
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error sending renewal alerts: {e}")
            return {
                "success": False,
                "message": f"Error sending alerts: {str(e)}",
                "alerts_sent": 0
            }
    
    def get_alerts(self, limit: int = 50, unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get alerts from the database"""
        try:
            query = self.db.query(Alert)
            
            if unread_only:
                query = query.filter(Alert.is_read == False)
            
            alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
            
            result = []
            for alert in alerts:
                # Get policy and building info
                policy = self.db.query(Policy).filter(Policy.id == alert.policy_id).first()
                building = None
                if policy:
                    building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                
                result.append({
                    "id": alert.id,
                    "alert_type": alert.alert_type,
                    "message": alert.message,
                    "priority": alert.priority,
                    "is_read": alert.is_read,
                    "is_sent": alert.is_sent,
                    "created_at": alert.created_at.isoformat(),
                    "policy": {
                        "id": policy.id if policy else None,
                        "policy_number": policy.policy_number if policy else None,
                        "carrier": policy.carrier if policy else None
                    },
                    "building": {
                        "id": building.id if building else None,
                        "name": building.name if building else None,
                        "address": building.address if building else None
                    }
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            return []
    
    def mark_alert_read(self, alert_id: str) -> bool:
        """Mark an alert as read"""
        try:
            alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.is_read = True
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error marking alert as read: {e}")
            return False
    
    def start_scheduler(self):
        """Start the background scheduler for automated checks"""
        if self.running:
            return
        
        # Schedule daily renewal check at 9 AM
        schedule.every().day.at("09:00").do(self._scheduled_renewal_check)
        
        # Schedule weekly cleanup at midnight Sunday
        schedule.every().sunday.at("00:00").do(self._scheduled_cleanup)
        
        self.running = True
        self.scheduler_thread = Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("Alert scheduler started")
    
    def stop_scheduler(self):
        """Stop the background scheduler"""
        self.running = False
        schedule.clear()
        logger.info("Alert scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler in a background thread"""
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def _scheduled_renewal_check(self):
        """Scheduled task to check renewals and send alerts"""
        logger.info("Running scheduled renewal check...")
        alerts = self.check_policy_renewals()
        if alerts:
            self.send_renewal_alerts()
    
    def _scheduled_cleanup(self):
        """Scheduled task to clean up old alerts"""
        try:
            # Delete read alerts older than 30 days
            cutoff_date = datetime.now() - timedelta(days=30)
            old_alerts = self.db.query(Alert).filter(
                Alert.is_read == True,
                Alert.created_at < cutoff_date
            ).delete()
            
            self.db.commit()
            logger.info(f"Cleaned up {old_alerts} old alerts")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error during alert cleanup: {e}")
    
    def close(self):
        """Close database connection and stop scheduler"""
        self.stop_scheduler()
        if self.db:
            self.db.close()

# CLI tool for testing alerts
def alerts_cli():
    """CLI tool for testing alert functionality"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python alerts.py <command> [args]")
        print("Commands:")
        print("  test_email <email>  - Send test email")
        print("  check_renewals      - Check for renewal alerts")
        print("  send_alerts         - Send pending alerts")
        print("  list_alerts         - List all alerts")
        sys.exit(1)
    
    command = sys.argv[1]
    alert_service = AlertService()
    
    try:
        if command == "test_email":
            if len(sys.argv) < 3:
                print("Usage: python alerts.py test_email <email>")
                sys.exit(1)
            
            email = sys.argv[2]
            result = alert_service.email_service.send_test_email(email)
            print(f"Test email result: {result}")
        
        elif command == "check_renewals":
            alerts = alert_service.check_policy_renewals()
            print(f"Created {len(alerts)} renewal alerts:")
            for alert in alerts:
                print(f"  - {alert['policy_number']}: {alert['message']}")
        
        elif command == "send_alerts":
            result = alert_service.send_renewal_alerts()
            print(f"Send alerts result: {result}")
        
        elif command == "list_alerts":
            alerts = alert_service.get_alerts()
            print(f"Found {len(alerts)} alerts:")
            for alert in alerts:
                status = "READ" if alert['is_read'] else "UNREAD"
                print(f"  - [{alert['priority'].upper()}] {alert['message']} ({status})")
        
        else:
            print(f"Unknown command: {command}")
    
    finally:
        alert_service.close()

if __name__ == "__main__":
    alerts_cli()
