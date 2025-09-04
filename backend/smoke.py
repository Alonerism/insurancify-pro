#!/usr/bin/env python3
"""
Smoke test script for Insurance Master Backend
Tests the complete system end-to-end
"""
import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def create_sample_pdf():
    """Create a sample PDF file for testing"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        c = canvas.Canvas(temp_file.name, pagesize=letter)
        
        # Add sample insurance policy content
        c.drawString(100, 750, "INSURANCE POLICY DOCUMENT")
        c.drawString(100, 720, "Policy Number: SMOKE-TEST-001")
        c.drawString(100, 690, "Carrier: Test Insurance Company")
        c.drawString(100, 660, "Coverage Type: General Liability")
        c.drawString(100, 630, "Effective Date: 01/01/2024")
        c.drawString(100, 600, "Expiration Date: 12/31/2024")
        c.drawString(100, 570, "Property: Smoke Test Building")
        c.drawString(100, 540, "Address: 123 Test Street, Test City, TC 12345")
        c.drawString(100, 510, "Annual Premium: $15,000")
        c.drawString(100, 480, "Aggregate Limit: $2,000,000")
        c.drawString(100, 450, "Per Occurrence Limit: $1,000,000")
        c.drawString(100, 420, "Deductible: $5,000")
        
        c.save()
        temp_file.close()
        
        return temp_file.name
    except ImportError:
        print("WARNING: reportlab not available, creating dummy PDF file")
        # Create a dummy file that will fail parsing gracefully
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.write(b"Dummy PDF content for testing")
        temp_file.close()
        return temp_file.name

def test_database_operations():
    """Test basic database operations"""
    print("🔍 Testing database operations...")
    
    try:
        from database import init_database, seed_database
        from ui_backend_adapter import UIBackendAdapter
        
        # Initialize database
        init_database()
        print("  ✅ Database initialized")
        
        # Seed with sample data
        seed_database()
        print("  ✅ Database seeded")
        
        # Test adapter
        adapter = UIBackendAdapter()
        
        # Test agents
        agents = adapter.list_agents()
        assert len(agents) > 0, "No agents found"
        print(f"  ✅ Found {len(agents)} agents")
        
        # Test buildings
        buildings = adapter.list_buildings()
        assert len(buildings) > 0, "No buildings found"
        print(f"  ✅ Found {len(buildings)} buildings")
        
        # Test policies
        policies = adapter.get_policies()
        assert len(policies) > 0, "No policies found"
        print(f"  ✅ Found {len(policies)} policies")
        
        adapter.close()
        return True
        
    except Exception as e:
        print(f"  ❌ Database test failed: {e}")
        return False

def test_pdf_parsing():
    """Test PDF parsing functionality"""
    print("🔍 Testing PDF parsing...")
    
    try:
        from pdf_parser import PDFParser
        
        # Create sample PDF
        pdf_path = create_sample_pdf()
        
        try:
            parser = PDFParser()
            result = parser.parse_pdf(pdf_path)
            
            print(f"  ✅ PDF parsed with confidence: {result['confidence']:.2f}")
            print(f"  ✅ Extracted metadata: {len(result['metadata'])} fields")
            print(f"  ✅ Extracted text: {len(result['text'])} characters")
            
            return True
            
        finally:
            # Clean up
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
        
    except Exception as e:
        print(f"  ❌ PDF parsing test failed: {e}")
        return False

def test_file_ingestion():
    """Test file ingestion and storage"""
    print("🔍 Testing file ingestion...")
    
    try:
        from ingestion import FileIngestionService
        from ui_backend_adapter import UIBackendAdapter
        
        # Get a building to link to
        adapter = UIBackendAdapter()
        buildings = adapter.list_buildings()
        if not buildings:
            print("  ⚠️  No buildings available for ingestion test")
            return False
        
        building_id = buildings[0]['id']
        
        # Create sample PDF
        pdf_path = create_sample_pdf()
        
        try:
            service = FileIngestionService()
            result = service.ingest_file(
                file_path=pdf_path,
                original_filename="smoke_test_policy.pdf",
                building_id=building_id
            )
            
            if result['success']:
                print(f"  ✅ File ingested successfully")
                print(f"  ✅ File ID: {result['file_id']}")
                print(f"  ✅ Confidence: {result['confidence']:.2f}")
                if result.get('suggested_policy_id'):
                    print(f"  ✅ Auto-linked to policy: {result['suggested_policy_id']}")
                return True
            else:
                print(f"  ❌ Ingestion failed: {result['message']}")
                return False
                
        finally:
            # Clean up
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
            adapter.close()
        
    except Exception as e:
        print(f"  ❌ File ingestion test failed: {e}")
        return False

def test_policy_notes():
    """Test adding policy notes"""
    print("🔍 Testing policy notes...")
    
    try:
        from ui_backend_adapter import UIBackendAdapter
        
        adapter = UIBackendAdapter()
        
        # Get a policy to add note to
        policies = adapter.get_policies()
        if not policies:
            print("  ⚠️  No policies available for notes test")
            return False
        
        policy_id = policies[0]['id']
        
        # Add a note
        result = adapter.add_policy_note(
            policy_id=policy_id,
            note="Smoke test note - system is working correctly!"
        )
        
        if result['success']:
            print(f"  ✅ Note added successfully")
            print(f"  ✅ History ID: {result['history_id']}")
            
            # Verify note was added
            history = adapter.get_policy_history(policy_id)
            if history and any("Smoke test note" in item['note'] for item in history):
                print("  ✅ Note verified in policy history")
                return True
            else:
                print("  ⚠️  Note not found in history")
                return False
        else:
            print(f"  ❌ Failed to add note: {result['message']}")
            return False
            
        adapter.close()
        
    except Exception as e:
        print(f"  ❌ Policy notes test failed: {e}")
        return False

def test_search_functionality():
    """Test search functionality"""
    print("🔍 Testing search functionality...")
    
    try:
        from ui_backend_adapter import UIBackendAdapter
        
        adapter = UIBackendAdapter()
        
        # Test basic search
        results = adapter.search_policies("State Farm")
        print(f"  ✅ Search for 'State Farm' returned {len(results)} results")
        
        # Test search suggestions
        suggestions = adapter.get_search_suggestions("State", 5)
        print(f"  ✅ Search suggestions for 'State' returned {len(suggestions)} items")
        
        # Test empty search
        empty_results = adapter.search_policies("")
        assert len(empty_results) == 0, "Empty search should return no results"
        print("  ✅ Empty search handled correctly")
        
        adapter.close()
        return True
        
    except Exception as e:
        print(f"  ❌ Search test failed: {e}")
        return False

def test_alerts_system():
    """Test alerts and email system"""
    print("🔍 Testing alerts system...")
    
    try:
        from ui_backend_adapter import UIBackendAdapter
        
        adapter = UIBackendAdapter()
        
        # Check for renewal alerts
        alerts = adapter.check_renewals()
        print(f"  ✅ Renewal check completed, found {len(alerts)} alerts")
        
        # Get all alerts
        all_alerts = adapter.get_alerts()
        print(f"  ✅ Retrieved {len(all_alerts)} total alerts")
        
        # Test email (only if configured)
        email_result = adapter.send_test_email("test@example.com")
        if email_result['success']:
            print("  ✅ Test email sent successfully")
        else:
            print(f"  ⚠️  Email not configured: {email_result['message']}")
        
        adapter.close()
        return True
        
    except Exception as e:
        print(f"  ❌ Alerts test failed: {e}")
        return False

def test_system_stats():
    """Test system statistics"""
    print("🔍 Testing system statistics...")
    
    try:
        from ui_backend_adapter import UIBackendAdapter
        
        adapter = UIBackendAdapter()
        
        result = adapter.get_system_stats()
        if result['success']:
            stats = result['stats']
            print(f"  ✅ System stats retrieved:")
            print(f"    - Agents: {stats['agents_count']}")
            print(f"    - Buildings: {stats['buildings_count']}")
            print(f"    - Policies: {stats['policies_count']}")
            print(f"    - Files: {stats['files_count']}")
            print(f"    - History entries: {stats['history_entries_count']}")
            return True
        else:
            print(f"  ❌ Failed to get stats: {result.get('message', 'Unknown error')}")
            return False
            
        adapter.close()
        
    except Exception as e:
        print(f"  ❌ System stats test failed: {e}")
        return False

def main():
    """Run all smoke tests"""
    print("🚀 Starting Insurance Master Backend Smoke Test")
    print("=" * 60)
    
    # Check environment
    if not os.path.exists('.env'):
        print("⚠️  No .env file found. Copying from env.example...")
        if os.path.exists('env.example'):
            shutil.copy('env.example', '.env')
            print("✅ Created .env from env.example")
        else:
            print("❌ No env.example file found")
            return False
    
    tests = [
        test_database_operations,
        test_pdf_parsing,
        test_file_ingestion,
        test_policy_notes,
        test_search_functionality,
        test_alerts_system,
        test_system_stats
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"  ❌ Test failed with exception: {e}")
            print()
    
    print("=" * 60)
    print(f"🏁 Smoke Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
