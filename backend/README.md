# Insurance Master Backend

A complete Python backend for the Insurance Management System, providing secure database operations, PDF parsing, file ingestion, search capabilities, and email alerts.

## Features

- **SQLite Database**: Complete schema with agents, buildings, policies, files, and history
- **PDF Parser**: Extract metadata and text from insurance documents with confidence scoring
- **File Ingestion**: Safe file storage with auto-linking to policies and buildings
- **Full-Text Search**: SQLite FTS5-powered search across policies and history
- **Email Alerts**: SMTP alerts for policy renewals and expirations
- **REST API**: FastAPI endpoints for UI integration
- **Function Interface**: Direct Python function calls for embedded use

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your settings (optional for basic operation)
```

### 3. Initialize System

```bash
# Initialize database and seed with sample data
python src/database.py

# Or use the adapter
python src/ui_backend_adapter.py init
```

### 4. Run Smoke Test

```bash
# Verify everything works
python smoke.py
```

### 5. Start API Server (Optional)

```bash
python src/api_server.py
# API documentation: http://127.0.0.1:8000/docs
```

## Project Structure

```
backend/
├── src/                    # Source code
│   ├── models.py          # Database models
│   ├── database.py        # Database connection and setup
│   ├── pdf_parser.py      # PDF parsing utilities
│   ├── ingestion.py       # File ingestion service
│   ├── search.py          # Search functionality
│   ├── alerts.py          # Email alerts and scheduling
│   ├── ui_backend_adapter.py  # Main adapter interface
│   └── api_server.py      # FastAPI HTTP server
├── tests/                 # Unit tests
├── data/                  # Data directory (created on first run)
│   ├── insurance.db       # SQLite database
│   └── policies/          # Uploaded files
├── requirements.txt       # Python dependencies
├── env.example           # Environment template
└── smoke.py              # Smoke test script
```

## Usage Examples

### Direct Function Calls

```python
from src.ui_backend_adapter import UIBackendAdapter

adapter = UIBackendAdapter()

# List all agents
agents = adapter.list_agents()

# Get policies for a building
policies = adapter.get_policies(building_id="bld-1")

# Upload and parse a PDF
result = adapter.upload_pdf(
    file_path="/path/to/policy.pdf",
    original_filename="policy.pdf", 
    building_id="bld-1"
)

# Search policies
results = adapter.search_policies("State Farm")

# Add a note to a policy
adapter.add_policy_note(
    policy_id="pol-1",
    note="Renewed policy with updated terms"
)

adapter.close()
```

### CLI Tools

```bash
# Parse a PDF file
python src/pdf_parser.py /path/to/policy.pdf

# Ingest a file
python src/ingestion.py /path/to/policy.pdf bld-1

# Search policies
python src/search.py "State Farm"

# Check renewals and send alerts
python src/alerts.py check_renewals
python src/alerts.py send_alerts

# Send test email
python src/alerts.py test_email user@example.com
```

### HTTP API

```bash
# Get all agents
curl http://127.0.0.1:8000/api/agents

# Upload a PDF
curl -X POST -F "file=@policy.pdf" -F "building_id=bld-1" \
     http://127.0.0.1:8000/api/upload/pdf

# Search policies
curl -X POST -H "Content-Type: application/json" \
     -d '{"query":"State Farm","limit":10}' \
     http://127.0.0.1:8000/api/search
```

## Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=sqlite:///./data/insurance.db

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# OpenAI (Optional - for future Q&A features)
OPENAI_API_KEY=your-openai-key

# File Storage
UPLOAD_DIRECTORY=./data/policies/
MAX_FILE_SIZE_MB=50
```

### Email Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an "App Password" in security settings
3. Use the app password in `SMTP_PASSWORD`

## Database Schema

### Core Tables
- **agents**: Insurance agents and contacts
- **buildings**: Properties and buildings
- **policies**: Insurance policies with coverage details
- **policy_files**: Uploaded documents with parsed content
- **policy_history**: Notes and change history
- **alerts**: System alerts and notifications

### Search Index
- **policy_search**: FTS5 virtual table for full-text search

## API Endpoints

### System
- `GET /health` - Health check
- `POST /api/system/init` - Initialize system
- `GET /api/system/stats` - System statistics

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/{id}` - Get agent

### Buildings  
- `GET /api/buildings` - List buildings
- `POST /api/buildings` - Create building

### Policies
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy
- `GET /api/policies/{id}/history` - Get policy history
- `POST /api/policies/{id}/notes` - Add policy note

### Files
- `POST /api/upload/pdf` - Upload PDF
- `GET /api/files/{id}` - Download file

### Search
- `POST /api/search` - Search policies
- `GET /api/search/suggestions` - Get search suggestions

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts/check-renewals` - Check renewals
- `POST /api/email/test` - Send test email

## Testing

### Run Unit Tests

```bash
cd backend
pytest tests/ -v
```

### Run Smoke Test

```bash
python smoke.py
```

### Manual Testing

```bash
# Test database operations
python src/ui_backend_adapter.py agents

# Test PDF parsing
python src/pdf_parser.py sample.pdf

# Test search
python src/search.py --rebuild
python src/search.py "search term"

# Test alerts
python src/alerts.py check_renewals
python src/alerts.py test_email user@example.com
```

## Error Handling

The system handles various error conditions gracefully:

- **Password-protected PDFs**: Returns confidence=0 with friendly error
- **Image-only PDFs**: Attempts extraction, returns low confidence
- **Missing environment variables**: Features degrade gracefully
- **SMTP failures**: Alerts are logged but don't crash the system
- **Large files**: Size limits enforced with clear error messages
- **Database errors**: Transactions are rolled back, temporary files cleaned up

## Development

### Adding New Features

1. **Database changes**: Update `models.py` and create migration
2. **New endpoints**: Add to `api_server.py` 
3. **Business logic**: Add to appropriate service module
4. **UI integration**: Update `ui_backend_adapter.py`
5. **Tests**: Add unit tests and update smoke test

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with detailed output
python src/api_server.py --log-level debug

# Check database directly
sqlite3 data/insurance.db
```

## Deployment

### Production Setup

1. **Environment**: Use production values in `.env`
2. **Database**: Consider PostgreSQL for production
3. **Files**: Use proper file storage (S3, etc.)
4. **Process management**: Use gunicorn/supervisor
5. **Security**: Set up HTTPS, input validation, rate limiting

### Docker (Optional)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/
EXPOSE 8000
CMD ["python", "src/api_server.py"]
```

## Security Considerations

- **File uploads**: Validated file types and size limits
- **Input validation**: All inputs sanitized 
- **SQL injection**: Using SQLAlchemy ORM
- **Secrets**: Never committed, use `.env` file
- **CORS**: Configured for development, adjust for production
- **File storage**: Isolated directory with unique filenames

## Performance

- **Database**: SQLite with FTS5 for search
- **File storage**: Chunked reading for large files
- **Search**: Optimized queries with ranking
- **Caching**: Consider Redis for production
- **Async**: FastAPI async endpoints where beneficial

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure `pip install -r requirements.txt`
2. **Database locked**: Check for hanging connections
3. **File permissions**: Ensure writable `data/` directory
4. **Email not working**: Verify SMTP settings and credentials
5. **Search not working**: Rebuild search index

### Debug Commands

```bash
# Check system status
python src/ui_backend_adapter.py stats

# Rebuild search index
python src/search.py --rebuild

# Clean up orphaned files
python -c "from src.ingestion import FileIngestionService; FileIngestionService().cleanup_orphaned_files()"

# Check database integrity
sqlite3 data/insurance.db "PRAGMA integrity_check;"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Check the troubleshooting section
- Run the smoke test to identify problems
- Review logs for error details
- Create an issue with detailed information
