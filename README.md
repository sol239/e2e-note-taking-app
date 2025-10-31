# E2E Encrypted Note-Taking App

A zero-knowledge, end-to-end encrypted note-taking application with offline sync capabilities.

## Features

- **End-to-End Encryption**: All notes and files are encrypted client-side using XChaCha20-Poly1305
- **Zero-Knowledge Architecture**: Server never sees unencrypted data
- **Offline Sync**: Full offline functionality with background synchronization
- **Rich Text Editing**: TipTap-based editor for notes
- **File Upload**: Chunked file uploads with manifest management
- **Sharing**: Secure sharing with re-encrypted keys
- **Multi-Device Sync**: Real-time synchronization across devices

## Architecture

- **Frontend**: Next.js + TypeScript + React
- **Backend**: FastAPI + Python
- **Database**: PostgreSQL for metadata
- **Storage**: MinIO S3 for encrypted file chunks
- **Crypto**: libsodium-wrappers for encryption
- **Offline Storage**: IndexedDB for local caching

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e2e-note-taking-app
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - MinIO Console: http://localhost:9001 (admin/admin)

## Manual Development Setup

### Backend

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set environment variables**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/notedb"
   export MINIO_ENDPOINT="localhost:9000"
   export MINIO_ACCESS_KEY="minioadmin"
   export MINIO_SECRET_KEY="minioadmin"
   export SECRET_KEY="your-secret-key"
   ```

3. **Run the backend**
   ```bash
   python run.py
   ```

### Frontend

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend**
   ```bash
   npm run dev
   ```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Security Model

- **Key Hierarchy**: Wrap Key (WK) → User Master Key (UMK) → Item Keys (IK)
- **Client-Side Encryption**: All encryption/decryption happens in the browser
- **Secure Key Derivation**: PBKDF2 for password-based key derivation
- **Zero-Knowledge**: Server stores only encrypted metadata and file chunks

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app
│   │   ├── models/         # SQLAlchemy models
│   │   ├── services/       # Business logic
│   │   └── api/            # API routes
│   └── tests/              # Backend tests
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utilities and crypto
│   │   └── app/            # Next.js app router
│   └── public/             # Static assets
├── docker-compose.yml       # Docker orchestration
└── docs/                   # Documentation
```

## Contributing

1. Follow the established code style and architecture patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License.