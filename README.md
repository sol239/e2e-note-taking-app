# Notes - End-to-End Encrypted Note-Taking App

A modern, full-stack note-taking application with end-to-end encryption, featuring a block-based editor and rich content support. Built with Django REST Framework and Next.js.

## 🚀 Features

### Core Functionality
- **End-to-End Encryption** - Your notes are encrypted on your device and remain secure in transit
- **Block-Based Editor** - Flexible, modular content blocks for different content types
- **Rich Content Support** - Text, code, images, videos, audio, math equations, and more
- **WYSIWYG Editor** - What-you-see-is-what-you-get editing experience with formatting toolbar
- **Notebook Organization** - Organize notes into notebooks with timestamps
- **User Authentication** - Secure authentication with token-based API access

### Block Types
- Text blocks (paragraphs, headings, quotes)
- Lists (bulleted, numbered, todo)
- Code blocks with syntax highlighting
- Math equations (KaTeX support)
- Media blocks (images, videos, audio)
- Grid layouts for structured content
- Notebook links for cross-referencing
- Dividers for visual separation

### Advanced Features
- **Live Code Editor** - Edit and preview code in real-time
- **Customizable Block Settings** - Per-block styling (fonts, colors, borders, padding)
- **Global Settings** - Application-wide configuration
- **Export Functionality** - Export notebooks in various formats
- **Drag-and-Drop** - Reorder blocks with drag-and-drop
- **Image Upload** - Upload images via file picker or paste from clipboard
- **Responsive Design** - Modern, mobile-friendly interface with Tailwind CSS

## 🏗️ Architecture

### Backend (Django REST Framework)
```
backend/
├── accounts/          # User authentication and management
├── notes/             # Notebook and block models
├── middleware/        # Custom logging middleware
├── utils/             # Backend utilities (BackendHub logging)
└── notetaking/        # Project settings and configuration
```

**Key Technologies:**
- Django 5.2.8
- Django REST Framework
- Token-based authentication
- Argon2 password hashing
- SQLite database
- DRF Spectacular (API documentation)
- CORS support for frontend integration

### Frontend (Next.js + React)
```
frontend/
├── src/
│   ├── app/           # Next.js pages (login, register, notebooks)
│   ├── components/    # React components (19 specialized components)
│   ├── contexts/      # React contexts (settings, main view)
│   ├── models/        # TypeScript models (Block, DocumentManager, Settings)
│   ├── utils/         # Frontend utilities (FrontendHub, SyncWorker)
│   └── api/           # API integration layer
└── public/            # Static assets
```

**Key Technologies:**
- Next.js 16.0.1
- React 19.2.0
- TypeScript 5
- Tailwind CSS 4
- MDX Editor (@uiw/react-md-editor)
- KaTeX for math rendering
- Lucide React for icons
- Syntax highlighting for code blocks

## 📋 Prerequisites

- **Python** 3.8+ (for backend)
- **Node.js** 18+ (for frontend)
- **npm** or **yarn** (package manager)
- **Git** (for version control)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/sol239/e2e-note-taking-app.git
cd e2e-note-taking-app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration
Edit `backend/notetaking/settings.py`:
- `SECRET_KEY` - Change in production
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Configure for your domain
- `CORS_ALLOWED_ORIGINS` - Update for production frontend URL

### Frontend Configuration
Edit `frontend/next.config.ts` and API endpoints in `frontend/src/api/auth.ts`

## 📡 API Endpoints

### Authentication
- `POST /api/accounts/register/` - Register new user
- `POST /api/accounts/login/` - Login and get token
- `GET /api/accounts/user/` - Get current user details
- `PATCH /api/accounts/user/` - Update user profile

### Notebooks
- `GET /api/notes/notebooks/` - List user's notebooks
- `POST /api/notes/notebooks/` - Create new notebook
- `GET /api/notes/notebooks/{id}/` - Get notebook details
- `PUT /api/notes/notebooks/{id}/` - Update notebook
- `DELETE /api/notes/notebooks/{id}/` - Delete notebook

### Blocks
- `GET /api/notes/notebooks/{id}/blocks/` - List notebook blocks
- `POST /api/notes/notebooks/{id}/blocks/` - Create new block
- `PUT /api/notes/blocks/{id}/` - Update block
- `DELETE /api/notes/blocks/{id}/` - Delete block
- `POST /api/notes/notebooks/{id}/blocks/bulk/` - Bulk update blocks

### Export
- `GET /api/notes/notebooks/{id}/export/` - Export notebook (JSON/ZIP)

## 🗂️ Data Models

### User Model
- Email-based authentication (no username)
- Nickname support
- Argon2 password hashing
- Token-based API access

### Notebook Model
- UUID primary key
- Many-to-many relationship with users
- Last opened timestamp tracking

### Block Model
- UUID primary key
- Type (paragraph, code, image, etc.)
- Content (text/JSON)
- Metadata (language, URLs, grid config, etc.)
- Settings (styling, fonts, colors)
- Position tracking (order within notebook)

## 🎨 Component Architecture

### Core Components
- **NoteEditor** - Main editor orchestrator with DocumentManager
- **BlockComponent** - Individual block renderer with 17+ block type support
- **WYSIWYGEditor** - Rich text editor with formatting toolbar
- **LiveCodeEditor** - Real-time code editing
- **LayoutWrapper** - Application layout and navigation
- **Sidebar** - Notebook navigation
- **NotebookMenu** - Notebook management
- **ExportModal** - Export functionality

### Specialized Block Components
- **AudioBlock**, **VideoBlock**, **ImageBlock** - Media handling
- **GridBlock** - Grid layout system
- **NotebookLinkBlock** - Cross-notebook references
- **CodeBlockRenderer** - Syntax-highlighted code display

### Settings & Panels
- **GlobalSettingsPanel** - App-wide settings
- **BlockSettingsPanel** - Per-block customization
- **UserSettings** - User profile management

## 🔐 Security Features

- **Argon2 Password Hashing** - Industry-standard password security
- **Token Authentication** - Secure API access
- **CORS Configuration** - Controlled cross-origin requests
- **Django Security Middleware** - Built-in Django protections
- **End-to-End Encryption** - Client-side encryption (mentioned in UI)

## 🧪 Development

### Backend Development
```bash
cd backend
python manage.py runserver
```

Access Django admin at `http://localhost:8000/admin/`

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
python manage.py collectstatic
gunicorn notetaking.wsgi:application
```

**Frontend:**
```bash
npm run build
npm start
```

## 📝 Scripts

### Backend
- `python manage.py migrate` - Run database migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py runserver` - Start development server

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🌟 Key Features Implementation

### Document Management
The `DocumentManager` class handles:
- Block creation, updates, and deletion
- Position tracking and reordering
- Undo/redo functionality
- Change callbacks for synchronization

### Logging System
- **BackendHub** - Centralized backend logging with file and console output
- **FrontendHub** - Frontend request/response logging with emoji indicators
- Daily log rotation

### Middleware
- **LoggingMiddleware** - Request/response logging for all API calls
- CORS middleware for frontend integration

## 🤝 Contributing

This is a personal project. If you'd like to contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is private and not currently licensed for public use.

## 👤 Author

**sol239**
- GitHub: [@sol239](https://github.com/sol239)

## 🙏 Acknowledgments

- Django REST Framework team
- Next.js and React teams
- Contributors to all open-source dependencies

---

**Note:** This application advertises end-to-end encryption but the actual encryption implementation should be verified and audited before production use with sensitive data.