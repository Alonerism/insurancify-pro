"""
PDF parsing utilities for insurance documents
"""
import os
import re
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import pdfplumber
import PyPDF2
from io import BytesIO

logger = logging.getLogger(__name__)

class PDFParser:
    """PDF parser for insurance documents with metadata extraction"""
    
    def __init__(self):
        self.confidence_threshold = 0.5
        
    def parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Parse PDF and extract text and metadata
        Returns: {metadata: dict, text: str, confidence: float}
        """
        try:
            # Try pdfplumber first (better for text extraction)
            result = self._parse_with_pdfplumber(file_path)
            if result["confidence"] > 0:
                return result
                
            # Fallback to PyPDF2
            logger.info(f"pdfplumber failed for {file_path}, trying PyPDF2")
            return self._parse_with_pypdf2(file_path)
            
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {e}")
            return {
                "metadata": {"error": str(e)},
                "text": "",
                "confidence": 0.0
            }
    
    def _parse_with_pdfplumber(self, file_path: str) -> Dict[str, Any]:
        """Parse PDF using pdfplumber"""
        try:
            with pdfplumber.open(file_path) as pdf:
                # Check if PDF is password protected
                if pdf.metadata.get('Encrypt'):
                    return {
                        "metadata": {"error": "Password protected PDF"},
                        "text": "",
                        "confidence": 0.0
                    }
                
                text_parts = []
                total_chars = 0
                
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                        total_chars += len(page_text.strip())
                
                full_text = "\n\n".join(text_parts)
                
                # Calculate confidence based on text extraction
                confidence = min(1.0, total_chars / 1000) if total_chars > 50 else 0.0
                
                # Extract metadata
                metadata = self._extract_metadata(full_text, pdf.metadata)
                
                return {
                    "metadata": metadata,
                    "text": full_text,
                    "confidence": confidence
                }
                
        except Exception as e:
            logger.error(f"pdfplumber error: {e}")
            return {
                "metadata": {"error": str(e)},
                "text": "",
                "confidence": 0.0
            }
    
    def _parse_with_pypdf2(self, file_path: str) -> Dict[str, Any]:
        """Fallback parser using PyPDF2"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                # Check if encrypted
                if reader.is_encrypted:
                    return {
                        "metadata": {"error": "Password protected PDF"},
                        "text": "",
                        "confidence": 0.0
                    }
                
                text_parts = []
                for page in reader.pages:
                    try:
                        text = page.extract_text()
                        if text:
                            text_parts.append(text)
                    except Exception as e:
                        logger.warning(f"Error extracting page: {e}")
                        continue
                
                full_text = "\n\n".join(text_parts)
                confidence = 0.3 if len(full_text.strip()) > 100 else 0.0
                
                # Extract metadata
                metadata = self._extract_metadata(full_text, reader.metadata)
                
                return {
                    "metadata": metadata,
                    "text": full_text,
                    "confidence": confidence
                }
                
        except Exception as e:
            logger.error(f"PyPDF2 error: {e}")
            return {
                "metadata": {"error": str(e)},
                "text": "",
                "confidence": 0.0
            }
    
    def _extract_metadata(self, text: str, pdf_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Extract insurance-specific metadata from text"""
        metadata = {}
        
        # Add PDF metadata if available
        if pdf_metadata:
            metadata.update({
                "pdf_title": pdf_metadata.get("/Title", ""),
                "pdf_author": pdf_metadata.get("/Author", ""),
                "pdf_subject": pdf_metadata.get("/Subject", ""),
                "pdf_creator": pdf_metadata.get("/Creator", ""),
                "pdf_creation_date": str(pdf_metadata.get("/CreationDate", "")),
            })
        
        # Extract policy number patterns
        policy_patterns = [
            r'Policy\s*(?:Number|No\.?|#)?\s*:?\s*([A-Z0-9\-]+)',
            r'(?:Policy|Contract)\s+([A-Z]{2,}-?\d{4,}-?\d{1,})',
            r'([A-Z]{2,}\-\d{4}\-\d{3,})',  # Common format like GL-2024-001
        ]
        
        for pattern in policy_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["policy_number"] = match.group(1).strip()
                break
        
        # Extract carrier/insurance company
        carrier_patterns = [
            r'(?:Carrier|Insurance Company|Insurer)\s*:?\s*([A-Za-z\s&.,]+?)(?:\n|$)',
            r'(?:Company|Corp|Corporation)\s*:?\s*([A-Za-z\s&.,]+?)(?:\n|$)',
        ]
        
        for pattern in carrier_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["carrier"] = match.group(1).strip()
                break
        
        # Extract dates
        date_patterns = [
            r'Effective\s*(?:Date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})',
            r'Expiration\s*(?:Date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})',
            r'Policy\s*Period\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s*(?:to|through|\-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})',
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    metadata["effective_date_raw"] = matches[0][0]
                    metadata["expiration_date_raw"] = matches[0][1]
                else:
                    metadata["date_found"] = matches[0]
                break
        
        # Extract coverage type
        coverage_patterns = [
            r'General\s+Liability',
            r'Property\s+Insurance',
            r'Umbrella\s+(?:Coverage|Insurance)',
            r'Flood\s+Insurance',
            r'Earthquake\s+Coverage',
            r'Workers?\s*Compensation',
        ]
        
        for pattern in coverage_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                coverage_type = pattern.lower().replace('\\s+', '-').replace('?', '')
                metadata["coverage_type"] = coverage_type
                break
        
        # Extract premium information
        premium_patterns = [
            r'Premium\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Annual\s*Premium\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Total\s*Premium\s*:?\s*\$?([\d,]+\.?\d*)',
        ]
        
        for pattern in premium_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    premium_str = match.group(1).replace(',', '')
                    metadata["premium"] = float(premium_str)
                    break
                except ValueError:
                    continue
        
        # Extract limits and deductibles
        limits_pattern = r'Limit\s*:?\s*\$?([\d,]+)'
        limits_matches = re.findall(limits_pattern, text, re.IGNORECASE)
        if limits_matches:
            metadata["limits_found"] = [limit.replace(',', '') for limit in limits_matches]
        
        deductible_pattern = r'Deductible\s*:?\s*\$?([\d,]+)'
        deductible_matches = re.findall(deductible_pattern, text, re.IGNORECASE)
        if deductible_matches:
            metadata["deductibles_found"] = [ded.replace(',', '') for ded in deductible_matches]
        
        return metadata
    
    def extract_building_info(self, text: str) -> Dict[str, Any]:
        """Extract building/property information from text"""
        building_info = {}
        
        # Address patterns
        address_patterns = [
            r'(?:Property|Building|Address|Location)\s*:?\s*([^\n]+(?:\n[^\n]*(?:Street|Ave|Road|Blvd|Drive|St|Avenue))[^\n]*)',
            r'(\d+\s+[A-Za-z\s]+(?:Street|Ave|Road|Blvd|Drive|St|Avenue)[^\n]*)',
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                building_info["address"] = match.group(1).strip()
                break
        
        # Building name
        name_patterns = [
            r'(?:Property|Building)\s*Name\s*:?\s*([^\n]+)',
            r'Insured\s*Property\s*:?\s*([^\n]+)',
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                building_info["name"] = match.group(1).strip()
                break
        
        return building_info

def parse_pdf_cli():
    """CLI tool for testing PDF parsing"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python pdf_parser.py <pdf_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
    
    parser = PDFParser()
    result = parser.parse_pdf(file_path)
    
    print(f"=== PDF PARSING RESULTS for {file_path} ===")
    print(f"Confidence: {result['confidence']:.2f}")
    print(f"\nMetadata:")
    for key, value in result['metadata'].items():
        print(f"  {key}: {value}")
    
    print(f"\nText length: {len(result['text'])} characters")
    if result['text']:
        print(f"Text preview (first 500 chars):")
        print(result['text'][:500] + "..." if len(result['text']) > 500 else result['text'])

if __name__ == "__main__":
    parse_pdf_cli()
