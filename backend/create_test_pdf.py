#!/usr/bin/env python3
"""
Create a test insurance policy PDF for testing
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def create_sample_insurance_pdf():
    """Create a sample insurance policy PDF"""
    filename = "test_files/sample_insurance_policy.pdf"
    
    # Create the PDF
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "COMMERCIAL GENERAL LIABILITY POLICY")
    
    # Policy details
    c.setFont("Helvetica", 12)
    y_position = height - 100
    
    lines = [
        "Policy Number: CGL-2024-987654",
        "Insurance Company: Acme Insurance Corporation",
        "",
        "Named Insured: Downtown Office Building LLC",
        "Policy Period: March 15, 2024 to March 15, 2025",
        "",
        "COVERAGE:",
        "General Liability",
        "",
        "LIMITS OF LIABILITY:",
        "General Aggregate Limit: $2,000,000",
        "Products/Completed Operations Aggregate: $2,000,000", 
        "Each Occurrence Limit: $1,000,000",
        "Personal & Advertising Injury Limit: $1,000,000",
        "Damage to Premises Rented to You: $300,000",
        "Medical Expense Limit: $10,000",
        "",
        "DEDUCTIBLES:",
        "Per Occurrence Deductible: $5,000",
        "",
        "PREMISES:",
        "Property Address: 555 Business Plaza, Suite 100",
        "City: San Francisco, CA 94105",
        "",
        "ANNUAL PREMIUM: $18,750",
        "",
        "AGENT INFORMATION:",
        "Agent: Sarah Johnson",
        "Agency: Premier Insurance Services",
        "Phone: (415) 555-0123",
        "Email: sarah.johnson@premierins.com",
        "",
        "This policy provides coverage subject to all terms,",
        "conditions, and exclusions contained herein."
    ]
    
    for line in lines:
        c.drawString(50, y_position, line)
        y_position -= 15
        
        # Start new page if needed
        if y_position < 100:
            c.showPage()
            y_position = height - 50
    
    c.save()
    print(f"Created sample insurance policy PDF: {filename}")
    return filename

if __name__ == "__main__":
    create_sample_insurance_pdf()
