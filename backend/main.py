#!/usr/bin/env python3
"""
Main entry point for Insurance Master Backend
Provides a unified CLI interface for all backend operations
"""
import os
import sys
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def main():
    parser = argparse.ArgumentParser(
        description="Insurance Master Backend CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py init                    # Initialize system
  python main.py serve                   # Start API server  
  python main.py test                    # Run smoke test
  python main.py agents                  # List agents
  python main.py upload file.pdf bld-1   # Upload PDF
  python main.py search "State Farm"     # Search policies
  python main.py email test@example.com  # Send test email
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Init command
    init_parser = subparsers.add_parser('init', help='Initialize system database')
    init_parser.add_argument('--seed', action='store_true', help='Seed with sample data')
    
    # Serve command  
    serve_parser = subparsers.add_parser('serve', help='Start API server')
    serve_parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    serve_parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    serve_parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Run smoke test')
    
    # Agents command
    agents_parser = subparsers.add_parser('agents', help='List agents')
    
    # Buildings command
    buildings_parser = subparsers.add_parser('buildings', help='List buildings')
    buildings_parser.add_argument('--agent', help='Filter by agent ID')
    
    # Policies command
    policies_parser = subparsers.add_parser('policies', help='List policies')
    policies_parser.add_argument('--building', help='Filter by building ID')
    policies_parser.add_argument('--agent', help='Filter by agent ID')
    
    # Upload command
    upload_parser = subparsers.add_parser('upload', help='Upload and parse PDF')
    upload_parser.add_argument('file', help='PDF file to upload')
    upload_parser.add_argument('building_id', help='Building ID to link to')
    upload_parser.add_argument('--policy', help='Policy ID to link to (optional)')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search policies')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--limit', type=int, default=10, help='Max results')
    search_parser.add_argument('--rebuild', action='store_true', help='Rebuild search index first')
    
    # Email command
    email_parser = subparsers.add_parser('email', help='Send test email')
    email_parser.add_argument('address', help='Email address to send to')
    
    # Alerts command
    alerts_parser = subparsers.add_parser('alerts', help='Manage alerts')
    alerts_parser.add_argument('--check', action='store_true', help='Check for new alerts')
    alerts_parser.add_argument('--send', action='store_true', help='Send pending alerts')
    alerts_parser.add_argument('--list', action='store_true', help='List all alerts')
    
    # Parse command
    parse_parser = subparsers.add_parser('parse', help='Parse PDF file')
    parse_parser.add_argument('file', help='PDF file to parse')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show system statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Handle commands
    try:
        if args.command == 'init':
            handle_init(args)
        elif args.command == 'serve':
            handle_serve(args)
        elif args.command == 'test':
            handle_test(args)
        elif args.command == 'agents':
            handle_agents(args)
        elif args.command == 'buildings':
            handle_buildings(args)
        elif args.command == 'policies':
            handle_policies(args)
        elif args.command == 'upload':
            handle_upload(args)
        elif args.command == 'search':
            handle_search(args)
        elif args.command == 'email':
            handle_email(args)
        elif args.command == 'alerts':
            handle_alerts(args)
        elif args.command == 'parse':
            handle_parse(args)
        elif args.command == 'stats':
            handle_stats(args)
        else:
            print(f"Unknown command: {args.command}")
            parser.print_help()
    
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def handle_init(args):
    """Initialize the system"""
    print("Initializing Insurance Master Backend...")
    
    from database import init_database, seed_database
    
    init_database()
    print("✅ Database initialized")
    
    if args.seed:
        seed_database()
        print("✅ Sample data seeded")
    
    print("🎉 System ready!")

def handle_serve(args):
    """Start the API server"""
    print(f"Starting API server on {args.host}:{args.port}")
    print(f"API docs: http://{args.host}:{args.port}/docs")
    
    import uvicorn
    uvicorn.run(
        "api_server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

def handle_test(args):
    """Run smoke test"""
    print("Running smoke test...")
    import subprocess
    result = subprocess.run([sys.executable, "smoke.py"], capture_output=False)
    sys.exit(result.returncode)

def handle_agents(args):
    """List agents"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        agents = adapter.list_agents()
        print(f"Found {len(agents)} agents:")
        for agent in agents:
            print(f"  {agent['id']}: {agent['name']} ({agent['company']})")
            print(f"    Email: {agent['email']}, Phone: {agent['phone']}")
    finally:
        adapter.close()

def handle_buildings(args):
    """List buildings"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        buildings = adapter.list_buildings(args.agent)
        print(f"Found {len(buildings)} buildings:")
        for building in buildings:
            print(f"  {building['id']}: {building['name']}")
            print(f"    Address: {building['address']}")
            if building['primary_agent']:
                print(f"    Agent: {building['primary_agent']['name']}")
            print(f"    Policies: {building['policy_count']}")
    finally:
        adapter.close()

def handle_policies(args):
    """List policies"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        policies = adapter.get_policies(args.building, args.agent)
        print(f"Found {len(policies)} policies:")
        for policy in policies:
            print(f"  {policy['policy_number']}: {policy['carrier']}")
            print(f"    Building: {policy['building']['name']}")
            print(f"    Coverage: {policy['coverage_type']}")
            print(f"    Status: {policy['status']}")
            print(f"    Premium: ${policy['premium_annual']:,}")
    finally:
        adapter.close()

def handle_upload(args):
    """Upload and parse PDF"""
    if not os.path.exists(args.file):
        print(f"File not found: {args.file}")
        return
    
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        result = adapter.upload_pdf(
            file_path=args.file,
            original_filename=os.path.basename(args.file),
            building_id=args.building_id,
            policy_id=args.policy
        )
        
        if result['success']:
            print("✅ File uploaded successfully!")
            print(f"File ID: {result['file_id']}")
            print(f"Confidence: {result['confidence']:.2f}")
            if result.get('suggested_policy_id'):
                print(f"Linked to policy: {result['suggested_policy_id']}")
            
            print("\nExtracted metadata:")
            for key, value in result['parsed_metadata'].items():
                print(f"  {key}: {value}")
        else:
            print(f"❌ Upload failed: {result['message']}")
    finally:
        adapter.close()

def handle_search(args):
    """Search policies"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        if args.rebuild:
            print("Rebuilding search index...")
            adapter.search_service.rebuild_search_index()
            print("✅ Search index rebuilt")
        
        results = adapter.search_policies(args.query, args.limit)
        print(f"Found {len(results)} results for '{args.query}':")
        
        for result in results:
            print(f"  {result['policy_number']}: {result['carrier']}")
            print(f"    Building: {result['building']['name']}")
            print(f"    Status: {result['status']}")
            if result['type'] == 'history':
                print(f"    Note: {result.get('note_preview', '')}")
    finally:
        adapter.close()

def handle_email(args):
    """Send test email"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        result = adapter.send_test_email(args.address)
        if result['success']:
            print(f"✅ Test email sent to {args.address}")
        else:
            print(f"❌ Failed to send email: {result['message']}")
    finally:
        adapter.close()

def handle_alerts(args):
    """Manage alerts"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        if args.check:
            alerts = adapter.check_renewals()
            print(f"✅ Found {len(alerts)} new alerts")
            for alert in alerts:
                print(f"  {alert['policy_number']}: {alert['message']}")
        
        elif args.send:
            result = adapter.alert_service.send_renewal_alerts()
            print(f"✅ Sent {result['alerts_sent']} alerts")
        
        elif args.list:
            alerts = adapter.get_alerts()
            print(f"Found {len(alerts)} alerts:")
            for alert in alerts:
                status = "UNREAD" if not alert['is_read'] else "READ"
                print(f"  [{alert['priority'].upper()}] {alert['message']} ({status})")
        
        else:
            print("Use --check, --send, or --list")
    finally:
        adapter.close()

def handle_parse(args):
    """Parse PDF file"""
    if not os.path.exists(args.file):
        print(f"File not found: {args.file}")
        return
    
    from pdf_parser import PDFParser
    
    parser = PDFParser()
    result = parser.parse_pdf(args.file)
    
    print(f"Parsing results for {args.file}:")
    print(f"Confidence: {result['confidence']:.2f}")
    print(f"Text length: {len(result['text'])} characters")
    
    print("\nExtracted metadata:")
    for key, value in result['metadata'].items():
        print(f"  {key}: {value}")
    
    if result['text']:
        print(f"\nText preview (first 300 chars):")
        print(result['text'][:300] + "..." if len(result['text']) > 300 else result['text'])

def handle_stats(args):
    """Show system statistics"""
    from ui_backend_adapter import UIBackendAdapter
    
    adapter = UIBackendAdapter()
    try:
        result = adapter.get_system_stats()
        if result['success']:
            stats = result['stats']
            print("📊 System Statistics:")
            print(f"  Agents: {stats['agents_count']}")
            print(f"  Buildings: {stats['buildings_count']}")
            print(f"  Policies: {stats['policies_count']}")
            print(f"  Files: {stats['files_count']}")
            print(f"  History entries: {stats['history_entries_count']}")
            print(f"  Unread alerts: {stats['unread_alerts_count']}")
            
            if 'policy_status_breakdown' in stats:
                print("\n📋 Policy Status Breakdown:")
                for status, count in stats['policy_status_breakdown'].items():
                    print(f"  {status}: {count}")
        else:
            print(f"❌ Failed to get stats: {result.get('message', 'Unknown error')}")
    finally:
        adapter.close()

if __name__ == "__main__":
    main()
