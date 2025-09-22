"""
PDF parsing utilities for insurance documents
Enhanced with carrier normalization and better date parsing
"""
import os
import re
import json
import logging
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime
import pdfplumber
import PyPDF2
from io import BytesIO
from database import SessionLocal
from models import CarrierMap

logger = logging.getLogger(__name__)

class PDFParser:
    """PDF parser for insurance documents with metadata extraction"""
    
    def __init__(self):
        self.confidence_threshold = 0.5
        self._carrier_map = None
        
    def _load_carrier_map(self) -> Dict[str, str]:
        """Load carrier normalization map from database or config"""
        if self._carrier_map is not None:
            return self._carrier_map
            
        try:
            db = SessionLocal()
            carriers = db.query(CarrierMap).all()
            self._carrier_map = {c.key.lower(): c.value for c in carriers}
            db.close()
            
            # Fallback to config file if database is empty
            if not self._carrier_map:
                config_path = os.path.join(os.path.dirname(__file__), "../config/carriers_map.json")
                if os.path.exists(config_path):
                    with open(config_path, 'r') as f:
                        self._carrier_map = json.load(f)
                else:
                    self._carrier_map = {}
                    
        except Exception as e:
            logger.warning(f"Could not load carrier map: {e}")
            self._carrier_map = {}
            
        return self._carrier_map
    
    def _normalize_carrier(self, raw_carrier: str) -> str:
        """Normalize carrier name using mapping table"""
        if not raw_carrier:
            return raw_carrier
            
        carrier_map = self._load_carrier_map()
        key = raw_carrier.lower().strip()
        
        # Try exact match first
        if key in carrier_map:
            return carrier_map[key]
            
        # Try partial matches
        for map_key, normalized in carrier_map.items():
            if map_key in key or key in map_key:
                return normalized
                
        return raw_carrier
    
    def _parse_date(self, date_str: str) -> Dict[str, Optional[str]]:
        """Parse date string to ISO format with raw preservation"""
        if not date_str:
            return {"raw": None, "iso": None}
            
        raw = date_str.strip()
        
        # Common date patterns
        patterns = [
            (r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})', "%m/%d/%Y"),  # MM/DD/YYYY
            (r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})', "%m/%d/%y"),   # MM/DD/YY
            (r'(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})', "%Y/%m/%d"),   # YYYY/MM/DD
            (r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', "%B %d, %Y"),          # Month DD, YYYY
            (r'(\d{1,2})\s+(\w+)\s+(\d{4})', "%d %B %Y"),             # DD Month YYYY
        ]
        
        for pattern, fmt in patterns:
            match = re.search(pattern, raw, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 3:
                        if fmt == "%m/%d/%Y" or fmt == "%m/%d/%y":
                            date_obj = datetime.strptime(f"{match.group(1)}/{match.group(2)}/{match.group(3)}", fmt)
                        elif fmt == "%Y/%m/%d":
                            date_obj = datetime.strptime(f"{match.group(1)}/{match.group(2)}/{match.group(3)}", fmt)
                        else:
                            date_obj = datetime.strptime(match.group(0), fmt)
                        
                        return {
                            "raw": raw,
                            "iso": date_obj.strftime("%Y-%m-%d")
                        }
                except ValueError:
                    continue
                    
        # Could not parse
        return {"raw": raw, "iso": None}
        
    def parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Parse PDF and extract text and metadata with enhanced error handling
        Returns: {metadata: dict, text: str, confidence: float, message: str}
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
                "confidence": 0.0,
                "message": f"PDF parsing failed: {str(e)}"
            }
    
    def _parse_with_pdfplumber(self, file_path: str) -> Dict[str, Any]:
        """Parse PDF using pdfplumber with enhanced error detection"""
        try:
            with pdfplumber.open(file_path) as pdf:
                # Check if PDF is password protected
                if pdf.metadata.get('Encrypt'):
                    return {
                        "metadata": {"error": "Password protected PDF"},
                        "text": "",
                        "confidence": 0.0,
                        "message": "password-protected PDF"
                    }
                
                # Extract text from all pages
                text_parts = []
                for page in pdf.pages:
                    try:
                        text = page.extract_text()
                        if text:
                            text_parts.append(text)
                    except Exception as e:
                        logger.warning(f"Error extracting page: {e}")
                        continue
                
                full_text = "\n".join(text_parts)
                
                # Check if this is an image-only PDF
                if not full_text.strip():
                    return {
                        "metadata": {"error": "Image-only PDF"},
                        "text": "",
                        "confidence": 0.0,
                        "message": "image-only PDF; OCR disabled"
                    }
                
                # Extract metadata
                metadata = self._extract_metadata(full_text)
                
                # Add PDF metadata
                pdf_metadata = pdf.metadata or {}
                metadata.update({
                    "pdf_title": pdf_metadata.get("Title", ""),
                    "pdf_author": pdf_metadata.get("Author", ""),
                    "pdf_subject": pdf_metadata.get("Subject", ""),
                    "pdf_creator": pdf_metadata.get("Creator", ""),
                    "pdf_creation_date": str(pdf_metadata.get("CreationDate", "")),
                })
                
                # Calculate confidence
                confidence = self._calculate_confidence(metadata, full_text)
                
                return {
                    "metadata": metadata,
                    "text": full_text,
                    "confidence": confidence,
                    "message": "successfully parsed" if confidence > 0 else "low confidence parsing"
                }
                
        except Exception as e:
            logger.error(f"pdfplumber error: {e}")
            return {
                "metadata": {"error": str(e)},
                "text": "",
                "confidence": 0.0,
                "message": f"pdfplumber parsing failed: {str(e)}"
            }
    
    def _parse_with_pypdf2(self, file_path: str) -> Dict[str, Any]:
        """Fallback parser using PyPDF2 with enhanced error handling"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                
                # Check if encrypted
                if reader.is_encrypted:
                    return {
                        "metadata": {"error": "Password protected PDF"},
                        "text": "",
                        "confidence": 0.0,
                        "message": "password-protected PDF"
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
                
                # Check if this is an image-only PDF
                if not full_text.strip():
                    return {
                        "metadata": {"error": "Image-only PDF"},
                        "text": "",
                        "confidence": 0.0,
                        "message": "image-only PDF; OCR disabled"
                    }
                
                # Extract metadata
                metadata = self._extract_metadata(full_text)
                
                # Add PDF metadata
                pdf_metadata = reader.metadata or {}
                metadata.update({
                    "pdf_title": pdf_metadata.get("/Title", ""),
                    "pdf_author": pdf_metadata.get("/Author", ""),
                    "pdf_subject": pdf_metadata.get("/Subject", ""),
                    "pdf_creator": pdf_metadata.get("/Creator", ""),
                    "pdf_creation_date": str(pdf_metadata.get("/CreationDate", "")),
                })
                
                # Calculate confidence
                confidence = self._calculate_confidence(metadata, full_text)
                
                return {
                    "metadata": metadata,
                    "text": full_text,
                    "confidence": confidence,
                    "message": "successfully parsed with PyPDF2" if confidence > 0 else "low confidence parsing"
                }
                
        except Exception as e:
            logger.error(f"PyPDF2 error: {e}")
            return {
                "metadata": {"error": str(e)},
                "text": "",
                "confidence": 0.0,
                "message": f"PyPDF2 parsing failed: {str(e)}"
            }
    
    def _extract_metadata(self, text: str) -> Dict[str, Any]:
        """Extract insurance-specific metadata from text with enhanced parsing"""
        metadata = {}
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
        
        # Extract carrier/insurance company with normalization
        carrier_found = None
        carrier_patterns = [
            r'(?:Insurance\s+Company|Carrier|Insurer)\s*:?\s*([A-Za-z0-9\s&.,\'-]+?)(?:\n|$|[A-Z]{2}\s+\d{5})',
            r'([A-Z][a-z]+\s+Insurance\s+(?:Company|Group|Corp))',
            r'([A-Z][a-z]+\s+Mutual\s+Insurance)',
            r'(State\s+Farm|Allstate|Geico|Progressive|Liberty\s+Mutual|Travelers|Farmers|Nationwide)',
        ]
        
        for pattern in carrier_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                carrier_found = match.group(1).strip()
                break
        
        if carrier_found:
            # Use carrier normalization
            normalized_carrier = self._normalize_carrier(carrier_found)
            metadata["carrier_raw"] = carrier_found
            metadata["carrier"] = normalized_carrier
        
        # Extract dates with enhanced parsing
        date_patterns = [
            (r'Effective\s*(?:Date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', 'effective_date'),
            (r'Expiration\s*(?:Date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', 'expiration_date'),
            (r'Policy\s*Period\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|through|\-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', 'period'),
            (r'Issue\s*(?:Date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', 'issue_date'),
        ]
        
        for pattern, date_type in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if date_type == 'period' and isinstance(matches[0], tuple):
                    # Handle policy period (start and end dates)
                    start_date = self._parse_date(matches[0][0])
                    end_date = self._parse_date(matches[0][1])
                    if start_date:
                        metadata["effective_date_raw"] = matches[0][0]
                        metadata["effective_date"] = start_date
                    if end_date:
                        metadata["expiration_date_raw"] = matches[0][1]
                        metadata["expiration_date"] = end_date
                else:
                    # Handle single dates
                    date_raw = matches[0] if isinstance(matches[0], str) else matches[0][0]
                    parsed_date = self._parse_date(date_raw)
                    if parsed_date:
                        metadata[f"{date_type}_raw"] = date_raw
                        metadata[date_type] = parsed_date
        
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
