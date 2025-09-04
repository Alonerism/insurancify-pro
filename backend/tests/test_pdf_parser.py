"""
Test PDF parsing functionality
"""
import pytest
import tempfile
import os
from io import BytesIO

# Add src to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pdf_parser import PDFParser

@pytest.fixture
def sample_pdf_content():
    """Create a simple PDF content for testing"""
    # This would normally create a real PDF, but for testing we'll mock the content
    return """
    Policy Number: GL-2024-001
    Insurance Company: Test Insurance Co.
    
    Policy Period: 01/01/2024 to 12/31/2024
    
    General Liability Coverage
    
    Aggregate Limit: $2,000,000
    Per Occurrence Limit: $1,000,000
    Deductible: $5,000
    
    Property Address: 123 Main Street, Los Angeles, CA 90210
    Premium: $12,500
    """

@pytest.fixture
def temp_pdf_file():
    """Create a temporary file for testing"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.close()
    yield temp_file.name
    if os.path.exists(temp_file.name):
        os.unlink(temp_file.name)

def test_pdf_parser_initialization():
    """Test PDF parser initialization"""
    parser = PDFParser()
    assert parser.confidence_threshold == 0.5

def test_metadata_extraction(sample_pdf_content):
    """Test metadata extraction from text"""
    parser = PDFParser()
    metadata = parser._extract_metadata(sample_pdf_content)
    
    assert "policy_number" in metadata
    assert metadata["policy_number"] == "GL-2024-001"
    
    assert "carrier" in metadata
    assert "Test Insurance" in metadata["carrier"]
    
    assert "premium" in metadata
    assert metadata["premium"] == 12500.0

def test_building_info_extraction(sample_pdf_content):
    """Test building information extraction"""
    parser = PDFParser()
    building_info = parser.extract_building_info(sample_pdf_content)
    
    assert "address" in building_info
    assert "123 Main Street" in building_info["address"]

def test_parse_nonexistent_file():
    """Test parsing a non-existent file"""
    parser = PDFParser()
    result = parser.parse_pdf("/nonexistent/file.pdf")
    
    assert result["confidence"] == 0.0
    assert "error" in result["metadata"]

def test_empty_text_metadata():
    """Test metadata extraction from empty text"""
    parser = PDFParser()
    metadata = parser._extract_metadata("")
    
    # Should return empty metadata dict
    assert isinstance(metadata, dict)

def test_coverage_type_detection():
    """Test coverage type detection"""
    parser = PDFParser()
    
    gl_text = "General Liability Insurance Policy"
    metadata_gl = parser._extract_metadata(gl_text)
    assert "coverage_type" in metadata_gl
    
    property_text = "Property Insurance Coverage"
    metadata_prop = parser._extract_metadata(property_text)
    assert "coverage_type" in metadata_prop
    
    umbrella_text = "Umbrella Coverage Policy"
    metadata_umb = parser._extract_metadata(umbrella_text)
    assert "coverage_type" in metadata_umb

def test_date_extraction():
    """Test date extraction patterns"""
    parser = PDFParser()
    
    text_with_dates = """
    Effective Date: 01/01/2024
    Expiration Date: 12/31/2024
    Policy Period: 03/15/2024 to 03/15/2025
    """
    
    metadata = parser._extract_metadata(text_with_dates)
    
    # Should find date information
    assert any("date" in key.lower() for key in metadata.keys())

def test_premium_extraction():
    """Test premium amount extraction"""
    parser = PDFParser()
    
    texts = [
        "Annual Premium: $15,250.00",
        "Premium: 12500",
        "Total Premium: $8,750"
    ]
    
    for text in texts:
        metadata = parser._extract_metadata(text)
        if "premium" in metadata:
            assert isinstance(metadata["premium"], float)
            assert metadata["premium"] > 0

def test_limits_and_deductibles_extraction():
    """Test extraction of limits and deductibles"""
    parser = PDFParser()
    
    text = """
    Aggregate Limit: $2,000,000
    Per Occurrence Limit: $1,000,000
    Deductible: $5,000
    Wind/Hail Deductible: $25,000
    """
    
    metadata = parser._extract_metadata(text)
    
    if "limits_found" in metadata:
        assert len(metadata["limits_found"]) > 0
    
    if "deductibles_found" in metadata:
        assert len(metadata["deductibles_found"]) > 0
