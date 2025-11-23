# Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [End-to-End Encryption](#end-to-end-encryption)
- [Data Flow](#data-flow)
- [Security Considerations](#security-considerations)

## Overview

This is a full-stack note-taking application with **end-to-end encryption (E2E)**, built using Django REST Framework for the backend and Next.js (React) for the frontend. The application implements a zero-knowledge architecture where the server never has access to unencrypted user content.

### Core Technologies
- **Backend**: Django 5.2.8, Django REST Framework, SQLite
- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Encryption**: Web Crypto API (AES-GCM 256-bit)
- **Authentication**: Token-based auth with optional TOTP 2FA
- **Testing**: Jest (unit), Cypress (E2E)

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐         HTTPS          ┌──────────────┐
│   Browser   │◄────────────────────────►│   Backend    │
│  (Next.js)  │     API Calls (JSON)    │   (Django)   │
└─────────────┘                         └──────────────┘
      │                                        │
      │ Local Encryption                      │
      │ (Web Crypto API)                      │ Database Access
      ▼                                        ▼
┌─────────────┐                         ┌──────────────┐
│  IndexedDB  │                         │   SQLite     │
│  (Future)   │                         │  (db.sqlite3)│
└─────────────┘                         └──────────────┘

    Client-Side                         Server-Side
   (Decrypted)                          (Encrypted)
```

### Request Flow
1. **User Action** → Frontend (Next.js)
2. **Client-Side Encryption** → CryptoManager encrypts data
3. **API Request** → HTTP request with encrypted payload
4. **Backend Processing** → Django validates and stores encrypted data
5. **Database Storage** → SQLite stores encrypted content
6. **Response** → Backend returns encrypted data
7. **Client-Side Decryption** → CryptoManager decrypts data
8. **UI Update** → React components display decrypted content

---

## Backend Architecture

### Directory Structure
```
backend/
├── manage.py                 # Django management script
├── db.sqlite3                # SQLite database
├── requirements.txt          # Python dependencies
├── notetaking/               # Main Django project
│   ├── settings.py           # Django settings & configuration
│   ├── urls.py               # Root URL routing
│   ├── wsgi.py               # WSGI application entry point
│   └── asgi.py               # ASGI application entry point
├── accounts/                 # User authentication app
│   ├── models.py             # User model with E2E fields
│   ├── views.py              # Auth endpoints (register, login, 2FA)
│   ├── serializers.py        # User data serialization
│   ├── urls.py               # Auth URL routing
│   └── migrations/           # Database migrations
├── notes/                    # Notes management app
│   ├── models.py             # Notebook, Block, Connector models
│   ├── views.py              # CRUD endpoints for notes
│   ├── serializers.py        # Note data serialization
│   ├── urls.py               # Notes URL routing
│   └── migrations/           # Database migrations
├── middleware/               # Custom middleware
│   └── logging_middleware.py # Request/response logging
├── utils/                    # Shared utilities
│   └── backend_hub.py        # Centralized logging system
├── logs/                     # Application logs
└── staticfiles/              # Static file serving
```

### Core Components

#### 1. User Model (`accounts/models.py`)
Custom user model with email-based authentication and E2E encryption support.

**Key Fields:**
- `email` - Primary identifier (unique)
- `nickname` - Display name
- `password` - Hashed using Django's PBKDF2 algorithm
- `totp_secret`, `totp_enabled` - Two-factor authentication
- `recovery_keys` - Backup recovery codes (JSON)
- **E2E Encryption Fields:**
  - `encrypted_master_key` - User's encrypted master key
  - `master_key_nonce` - IV for master key encryption
  - `master_key_salt` - Salt for key derivation
  - `argon_time`, `argon_memory` - KDF parameters

**Manager Methods:**
- `create_user()` - Create regular user
- `create_superuser()` - Create admin user

#### 2. Notes Models (`notes/models.py`)

**Notebook Model:**
- `id` (UUID) - Unique identifier
- `name` - Notebook title (encrypted on client)

**Block Model:**
- `id` (UUID) - Unique identifier
- `type` - Block type (paragraph, heading, code, etc.)
- `content` - Block content (encrypted on client)
- `metadata` - JSON field for type-specific data
- `settings` - JSON field for styling/configuration

**NotebookUserConnector Model:**
- Links users to notebooks (many-to-many)
- `last_opened` - Timestamp for sorting

**BlockNotebookConnector Model:**
- Links blocks to notebooks with positioning
- `position_id` - Group/section identifier
- `position_order` - Order within group

#### 3. API Views

**Authentication Endpoints (`accounts/views.py`):**
- `POST /api/accounts/register/` - User registration with E2E setup
- `POST /api/accounts/login/` - Login with optional 2FA
- `POST /api/accounts/verify-totp/` - TOTP verification
- `GET /api/accounts/user/` - Get current user info
- `PATCH /api/accounts/user/` - Update user info
- `POST /api/accounts/enable-totp/` - Enable 2FA
- `POST /api/accounts/disable-totp/` - Disable 2FA
- `POST /api/accounts/change-password/` - Change password & re-encrypt master key

**Notes Endpoints (`notes/views.py`):**
- `GET /api/notes/notebooks/` - List user's notebooks
- `POST /api/notes/notebooks/` - Create notebook
- `GET /api/notes/notebooks/<id>/` - Get notebook details
- `PUT /api/notes/notebooks/<id>/` - Update notebook
- `DELETE /api/notes/notebooks/<id>/` - Delete notebook
- `GET /api/notes/notebooks/<id>/blocks/` - List blocks in notebook
- `POST /api/notes/notebooks/<id>/blocks/` - Create block
- `GET /api/notes/blocks/<id>/` - Get block details
- `PUT /api/notes/blocks/<id>/` - Update block
- `DELETE /api/notes/blocks/<id>/` - Delete block
- `POST /api/notes/notebooks/<id>/export/` - Export notebook

#### 4. Middleware & Utilities

**LoggingMiddleware (`middleware/logging_middleware.py`):**
- Logs all incoming requests
- Logs all outgoing responses
- Integrates with BackendHub singleton

**BackendHub (`utils/backend_hub.py`):**
- Centralized logging system
- Outputs to both file and console
- Color-coded console output
- Daily log files (`logs/api_YYYYMMDD.log`)

### Database Schema

```sql
-- Users Table
User {
  id: Integer (PK)
  email: String (UNIQUE)
  password: String (Hashed)
  nickname: String (Nullable)
  totp_secret: String (Nullable)
  totp_enabled: Boolean
  recovery_keys: Text (JSON)
  encrypted_master_key: Text
  master_key_nonce: String
  master_key_salt: String
  argon_time: Integer
  argon_memory: Integer
  date_joined: DateTime
}

-- Notebooks Table
Notebook {
  id: UUID (PK)
  name: String
}

-- Blocks Table
Block {
  id: UUID (PK)
  type: String
  content: Text (Encrypted)
  metadata: JSON
  settings: JSON
}

-- User-Notebook Connector
NotebookUserConnector {
  id: Integer (PK)
  user_id: FK -> User
  notebook_id: FK -> Notebook
  last_opened: DateTime (Nullable)
  UNIQUE(user_id, notebook_id)
}

-- Block-Notebook Connector
BlockNotebookConnector {
  id: Integer (PK)
  block_id: FK -> Block
  notebook_id: FK -> Notebook
  position_id: Integer
  position_order: Integer
  UNIQUE(block_id, notebook_id)
}
```

### Authentication Flow

1. **Registration:**
   - User provides email and password
   - Frontend generates master key and encrypts it with password
   - Backend stores encrypted master key bundle
   - Returns auth token

2. **Login:**
   - User provides email and password
   - Backend verifies credentials
   - If 2FA enabled, returns temp token
   - Frontend decrypts master key using password
   - Master key stored in memory only

3. **2FA Verification:**
   - User provides TOTP code
   - Backend verifies code
   - Returns auth token

---

## Frontend Architecture

### Directory Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles
│   │   ├── login/              # Login page
│   │   ├── register/           # Register page
│   │   ├── notebooks/          # Notebooks pages
│   │   │   ├── page.tsx        # Notebooks list
│   │   │   └── [id]/           # Dynamic notebook page
│   │   └── settings/           # Settings page
│   ├── components/             # React components
│   │   ├── NoteEditor.tsx      # Main editor component
│   │   ├── BlockComponent.tsx  # Individual block renderer
│   │   ├── TextFormattingToolbar.tsx
│   │   ├── ImageBlock.tsx
│   │   ├── AudioBlock.tsx
│   │   ├── VideoBlock.tsx
│   │   ├── GridBlock.tsx
│   │   ├── CodeBlockRenderer.tsx
│   │   ├── LiveCodeEditor.tsx
│   │   ├── BlockSettingsPanel.tsx
│   │   ├── GlobalSettingsPanel.tsx
│   │   ├── ExportModal.tsx
│   │   ├── UnlockModal.tsx
│   │   ├── Sidebar.tsx
│   │   ├── NotebookMenu.tsx
│   │   └── LayoutWrapper.tsx
│   ├── contexts/               # React Context providers
│   │   ├── MainViewContext.tsx # Global state management
│   │   └── GlobalSettingsContext.tsx
│   ├── models/                 # TypeScript models
│   │   ├── Block.ts            # Block model & types
│   │   └── Notebook.ts         # Notebook model
│   ├── utils/                  # Utility modules
│   │   ├── CryptoManager.ts    # E2E encryption manager
│   │   ├── SyncWorker.ts       # Backend sync manager
│   │   └── FrontendHub.ts      # Frontend logging
│   ├── api/                    # API client
│   │   └── auth.ts             # API functions
│   └── __tests__/              # Unit tests
├── cypress/                    # E2E tests
│   ├── e2e/                    # Test specs
│   └── support/                # Test utilities
├── public/                     # Static assets
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # TailwindCSS config
└── jest.config.js              # Jest config
```

### Core Components

#### 1. State Management

**MainViewContext (`contexts/MainViewContext.tsx`):**
- Global application state
- Manages notebooks list
- Provides CRUD operations
- Optimistic updates
- Server synchronization

**GlobalSettingsContext (`contexts/GlobalSettingsContext.tsx`):**
- User preferences
- Theme settings
- Editor settings

#### 2. Encryption Manager (`utils/CryptoManager.ts`)

**Singleton class managing all cryptographic operations:**

**Key Methods:**
- `generateAndEncryptMasterKey(password)` - Registration
- `decryptMasterKey(password, bundle)` - Login
- `reEncryptMasterKey(newPassword)` - Password change
- `encryptData(plaintext)` - Content encryption
- `decryptData(encryptedData)` - Content decryption
- `hasMasterKey()` - Check if logged in
- `clearMasterKey()` - Logout

**Properties:**
- `masterKey: CryptoKey | null` - In-memory only
- `ALGORITHM: 'AES-GCM'` - Encryption algorithm
- `KEY_LENGTH: 256` - 256-bit keys
- `DEFAULT_ITERATIONS: 600000` - PBKDF2 iterations

#### 3. Sync Worker (`utils/SyncWorker.ts`)

**Singleton class managing backend synchronization:**
- Queues block updates
- Batch processing
- Automatic retry logic
- Conflict resolution
- Status tracking

#### 4. Block Model (`models/Block.ts`)

**Block Types:**
```typescript
enum BlockType {
  PARAGRAPH, HEADING1, HEADING2, HEADING3,
  BULLETED_LIST, NUMBERED_LIST, TODO,
  CODE, QUOTE, MATH, DIVIDER,
  IMAGE, VIDEO, AUDIO, GRID,
  NOTEBOOK_LINK
}
```

**Block Interface:**
```typescript
interface IBlock {
  id: string;              // UUID
  type: BlockType;
  content: string;         // Encrypted on server
  metadata?: {
    language?: string;     // Code blocks
    checked?: boolean;     // Todo items
    url?: string;          // Media blocks
    gridRows?: number;     // Grid blocks
    gridCols?: number;
    // ... more type-specific fields
  };
  settings?: {
    styling?: {
      fontSize, fontFamily,
      textColor, backgroundColor,
      // ... styling properties
    };
  };
  position_id?: number;
  position_order?: number;
}
```

#### 5. API Client (`api/auth.ts`)

**Core API Functions:**
- `register(email, password, masterKeyBundle)`
- `login(email, password)`
- `verifyTotp(tempToken, code)`
- `getUserInfo()`
- `updateUserInfo(data)`
- `getNotebooks()`
- `createNotebook(name)`
- `getNotebook(id)`
- `updateNotebook(id, data)`
- `deleteNotebook(id)`
- `getNotebookBlocks(notebookId)`
- `createBlock(notebookId, block)`
- `updateBlock(blockId, block)`
- `deleteBlock(blockId, notebookId)`

**Features:**
- Automatic token attachment
- Error handling
- Request/response logging via FrontendHub

#### 6. Main Components

**NoteEditor (`components/NoteEditor.tsx`):**
- Main editing interface
- Block list rendering
- Keyboard shortcuts
- Drag-and-drop reordering
- Inline editing
- Block type conversion

**BlockComponent (`components/BlockComponent.tsx`):**
- Renders individual blocks
- Type-specific rendering
- Inline editing
- Settings panel
- Styling application

**LayoutWrapper (`components/LayoutWrapper.tsx`):**
- App-wide layout
- Sidebar integration
- Authentication check
- Context providers

---

## End-to-End Encryption

### Encryption Architecture

The application implements **zero-knowledge encryption** - the server never sees unencrypted user content.

### Encryption Flow

#### Registration Process

```
1. User enters password
   ↓
2. Frontend generates random Master Key (AES-GCM 256-bit)
   ↓
3. Frontend generates random Salt (16 bytes)
   ↓
4. Frontend derives Wrapping Key from password using PBKDF2
   (600,000 iterations, SHA-256)
   ↓
5. Frontend encrypts Master Key with Wrapping Key
   ↓
6. Frontend sends to backend:
   - encrypted_master_key (base64)
   - master_key_nonce (base64)
   - master_key_salt (base64)
   - iterations: 600000
   ↓
7. Backend stores encrypted bundle
   ↓
8. Master Key stays in memory (never persisted client-side)
```

#### Login Process

```
1. User enters password
   ↓
2. Backend returns encrypted Master Key bundle
   ↓
3. Frontend derives Wrapping Key from password + salt
   ↓
4. Frontend decrypts Master Key using Wrapping Key
   ↓
5. Master Key stored in CryptoManager singleton (memory only)
   ↓
6. Master Key used to encrypt/decrypt all content
```

#### Content Encryption

```
Encryption (before sending to server):
1. User creates/edits content
   ↓
2. CryptoManager.encryptData(plaintext)
   ↓
3. Generate random IV (12 bytes)
   ↓
4. Encrypt with Master Key using AES-GCM
   ↓
5. Return { ciphertext, iv } (both base64)
   ↓
6. Send to backend

Decryption (after receiving from server):
1. Receive { ciphertext, iv } from backend
   ↓
2. CryptoManager.decryptData(encryptedData)
   ↓
3. Decrypt using Master Key + IV
   ↓
4. Return plaintext
   ↓
5. Display to user
```

### Cryptographic Specifications

**Algorithms:**
- **Symmetric Encryption**: AES-GCM 256-bit
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 600,000 (OWASP recommendation)
- **IV/Nonce Length**: 12 bytes (96 bits) for GCM
- **Salt Length**: 16 bytes (128 bits)

**Key Hierarchy:**
```
User Password (user input)
      ↓ PBKDF2 (600k iterations)
Wrapping Key (AES-GCM 256-bit, ephemeral)
      ↓ Encrypts/Decrypts
Master Key (AES-GCM 256-bit, in-memory)
      ↓ Encrypts/Decrypts
Content (blocks, notebook names, etc.)
```

### Security Properties

**What the server knows:**
- User email
- Password hash (Django PBKDF2)
- Encrypted master key + nonce + salt
- Encrypted content (ciphertext + IV)
- Metadata (timestamps, relationships)

**What the server does NOT know:**
- User's actual password (only hash)
- Master key (only has encrypted version)
- Decrypted content (only has ciphertext)
- Plaintext notebook names or block content

**Zero-Knowledge Guarantee:**
- Server cannot decrypt user content
- Compromised server → encrypted data only
- Password required to decrypt master key
- Master key required to decrypt content

### Password Change Flow

```
1. User enters old password + new password
   ↓
2. Frontend decrypts Master Key with old password
   ↓
3. Frontend re-encrypts Master Key with new password
   (new salt, new nonce)
   ↓
4. Frontend sends new encrypted bundle to backend
   ↓
5. Backend updates encrypted_master_key, nonce, salt
   ↓
6. Content remains encrypted with same Master Key
   (no need to re-encrypt all content)
```

### Logout Flow

```
1. User clicks logout
   ↓
2. CryptoManager.clearMasterKey()
   ↓
3. Master Key removed from memory
   ↓
4. All decrypted data cleared from state
   ↓
5. Redirect to login
```

---

## Data Flow

### Creating a Notebook

```
Frontend:
1. User enters notebook name
   ↓
2. Encrypt name with Master Key
   ↓
3. POST /api/notes/notebooks/
   { name: encrypted_name }
   ↓
Backend:
4. Validate token
   ↓
5. Create Notebook record
   ↓
6. Create NotebookUserConnector
   ↓
7. Create initial Block (heading with notebook name)
   ↓
8. Return encrypted notebook data
   ↓
Frontend:
9. Decrypt notebook name
   ↓
10. Update MainViewContext state
```

### Editing a Block

```
Frontend:
1. User types in block
   ↓
2. Debounced onChange event
   ↓
3. Encrypt content
   ↓
4. Queue update in SyncWorker
   ↓
5. SyncWorker batches updates (300ms window)
   ↓
6. PUT /api/notes/blocks/<id>/
   { content: encrypted_content }
   ↓
Backend:
7. Validate token & ownership
   ↓
8. Update Block record
   ↓
9. Return success
   ↓
Frontend:
10. Update sync status (synced)
```

### Opening a Notebook

```
Frontend:
1. User clicks notebook
   ↓
2. Navigate to /notebooks/[id]
   ↓
3. GET /api/notes/notebooks/<id>/blocks/
   ↓
Backend:
4. Validate token & access
   ↓
5. Return encrypted blocks + connectors
   ↓
6. Update last_opened timestamp
   ↓
Frontend:
7. Decrypt all block content
   ↓
8. Sort by position_id, position_order
   ↓
9. Render NoteEditor with blocks
```

---

## Security Considerations

### Authentication
- Token-based authentication
- Optional TOTP 2FA with recovery codes
- Secure password hashing (Django PBKDF2)
- Session management with token expiration

### Encryption
- AES-GCM provides both confidentiality and authenticity
- Random IVs for each encryption operation
- PBKDF2 with 600,000 iterations (OWASP recommendation)
- Master key never leaves client memory

### Data Protection
- All sensitive content encrypted before transmission
- HTTPS required for all API communication
- CORS configured for specific origins only
- SQL injection prevention via Django ORM

### Attack Vectors Mitigated
- **Server Compromise**: Content remains encrypted
- **Man-in-the-Middle**: HTTPS + authenticated encryption
- **Rainbow Tables**: Random salts per user
- **Brute Force**: High iteration count on PBKDF2
- **XSS**: React's built-in escaping, CSP headers recommended
- **CSRF**: Token-based auth (stateless)

### Potential Vulnerabilities
- **Client Compromise**: If attacker gains access to browser with loaded master key
- **Keylogger**: Could capture password during login
- **Weak Password**: User responsibility to choose strong password
- **Lost Password**: No password recovery (zero-knowledge architecture)

### Best Practices Implemented
- Principle of least privilege
- Defense in depth (multiple layers)
- Secure defaults
- Regular security updates
- Comprehensive logging for audit trails
- Input validation on both client and server

### Future Security Enhancements
- Rate limiting on authentication endpoints
- Account lockout after failed attempts
- Security headers (CSP, HSTS, etc.)
- Subresource Integrity (SRI) for CDN resources
- Regular security audits and penetration testing
- Hardware security key support (WebAuthn)

---

## Development & Testing

### Running the Application

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Testing

**Frontend Unit Tests:**
```bash
npm test
npm run test:coverage
```

**E2E Tests:**
```bash
npx cypress open
```

**Backend Tests:**
```bash
python manage.py test
```

---

## Conclusion

This architecture provides a secure, scalable note-taking application with true end-to-end encryption. The separation of concerns between frontend encryption and backend storage ensures that user data remains private while maintaining a smooth user experience. The modular design allows for easy extension and maintenance of both backend and frontend components.
