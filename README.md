# E2E Note-Taking App

A modern, secure note-taking application with end-to-end encryption, built with Next.js and Django REST Framework.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Django](https://img.shields.io/badge/django-5.2-green.svg)
![Next.js](https://img.shields.io/badge/next.js-16.0-black.svg)

## 📖 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete guide for end users
- **[Architecture](docs/ARCHITECTURE.md)** - Complete architecture of the application
- **API Documenta**tion** - Available at `/api/schema/swagger-ui/` when running the backend (http://localhost:8000/api/schema/swagger-ui/)

## 🌟 Features

### Security & Privacy
- **End-to-End Encryption**: Your notes are encrypted on your device using AES-GCM 256-bit encryption before being sent to the server
- **PBKDF2 Key Derivation**: 600,000 iterations following OWASP recommendations
- **Two-Factor Authentication (2FA)**: Optional TOTP-based 2FA with QR code setup
- **Recovery Keys**: Secure account recovery mechanism
- **Zero-Knowledge Architecture**: Server never has access to your unencrypted data

### Rich Content Editing
- **Multiple Block Types**: 
  - Text blocks (paragraph, headings, lists, quotes)
  - Code blocks with syntax highlighting
  - Mathematical equations with KaTeX rendering
  - Media blocks (images, videos, audio)
  - Grid layouts for organizing content
  - Notebook links for cross-referencing
  - Todo items with checkboxes
- **WYSIWYG Editor**: Real-time markdown editing with preview
- **Live Code Editor**: Execute code snippets directly in the browser
- **Drag & Drop**: Reorder blocks with intuitive drag-and-drop interface
- **Export Functionality**: Export notebooks to various formats

### User Experience
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Global Settings**: Customize editor preferences and styling
- **Block-Level Settings**: Fine-tune individual block appearance
- **Recent Notebooks**: Quick access to recently opened notebooks
- **Multi-Notebook Management**: Organize notes into separate notebooks

## 🏗️ Architecture

### Frontend (Next.js 16 + TypeScript)
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── login/        # Authentication
│   │   ├── register/     # User registration
│   │   ├── notebooks/    # Notebook management
│   │   └── settings/     # User settings
│   ├── components/       # React components
│   │   ├── NoteEditor.tsx
│   │   ├── BlockComponent.tsx
│   │   ├── WYSIWYGEditor.tsx
│   │   └── ...
│   ├── models/           # TypeScript models
│   │   ├── Block.ts
│   │   ├── DocumentManager.ts
│   │   └── Settings.ts
│   ├── utils/            # Utilities
│   │   ├── CryptoManager.ts
│   │   ├── FrontendHub.ts
│   │   └── SyncWorker.ts
│   ├── contexts/         # React contexts
│   └── api/              # API client functions
└── cypress/              # E2E tests
```

**Key Frontend Technologies:**
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Web Crypto API**: Client-side encryption
- **React Contexts**: State management
- **Tailwind CSS**: Utility-first styling
- **KaTeX**: Math rendering
- **Lucide Icons**: Icon library

### Backend (Django 5.2 + DRF)
```
backend/
├── accounts/             # User authentication & management
│   ├── models.py         # Custom User model with E2E fields
│   ├── views.py          # Auth endpoints
│   ├── serializers.py    # User serializers
│   └── tests.py          # Unit tests
├── notes/                # Notebook & block management
│   ├── models.py         # Notebook, Block, connector models
│   ├── views.py          # CRUD endpoints
│   ├── serializers.py    # Note serializers
│   └── tests.py          # Unit tests
├── middleware/           # Custom middleware
│   └── logging_middleware.py
├── utils/                # Utilities
│   └── backend_hub.py    # Centralized logging
└── notetaking/           # Django project settings
```

**Key Backend Technologies:**
- **Django 5.2**: Web framework
- **Django REST Framework**: RESTful API
- **Token Authentication**: Secure API access
- **SQLite**: Database (easily swappable)
- **Argon2**: Password hashing
- **PyOTP**: TOTP 2FA implementation
- **drf-spectacular**: OpenAPI documentation

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- **Node.js 20+**
- **npm or yarn**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server:**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

### Environment Configuration

The application works out of the box with default settings. For production:

**Backend (`backend/notetaking/settings.py`):**
- Change `SECRET_KEY`
- Set `DEBUG = False`
- Update `ALLOWED_HOSTS`
- Configure production database
- Set up proper CORS origins

**Frontend:**
- Update API endpoint URLs if backend is not on `localhost:8000`

## 🧪 Testing

### Backend Tests

Run Django unit tests:
```bash
cd backend
python manage.py test
```

Run with coverage:
```bash
coverage run --source='.' manage.py test
coverage report
coverage html
```

**Test Coverage:**
- User model and manager tests
- Serializer validation tests
- API endpoint tests (auth, 2FA, CRUD)
- Model relationship tests

### Frontend Tests

Run Jest unit tests:
```bash
cd frontend
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Run in watch mode:
```bash
npm run test:watch
```

**Test Coverage:**
- Block model tests
- CryptoManager encryption/decryption tests
- DocumentManager CRUD operations
- FrontendHub logging tests

### End-to-End Tests (Cypress)

Run E2E tests:
```bash
cd frontend
npx cypress open    # Interactive mode
npx cypress run     # Headless mode
```

**E2E Test Suites:**
- Home page navigation
- User registration and validation
- Login flow with 2FA
- Notebook creation and management
- Notebook import functionality
- Settings (profile, security, editor preferences)

## 📚 API Documentation

The API is documented using drf-spectacular. Once the backend is running, access:
- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

### Key API Endpoints

#### Authentication
- `POST /api/accounts/register/` - Register new user
- `POST /api/accounts/login/` - Login and get token
- `GET /api/accounts/user/` - Get current user details
- `PUT /api/accounts/user/` - Update user profile
- `DELETE /api/accounts/user/` - Delete account

#### Two-Factor Authentication
- `POST /api/accounts/2fa/setup/` - Setup TOTP
- `POST /api/accounts/2fa/enable/` - Enable 2FA
- `POST /api/accounts/2fa/disable/` - Disable 2FA
- `POST /api/accounts/2fa/verify/` - Verify TOTP code

#### Notebooks
- `GET /api/notes/notebooks/` - List user's notebooks
- `POST /api/notes/notebooks/` - Create notebook
- `GET /api/notes/notebooks/<id>/` - Get notebook details
- `PUT /api/notes/notebooks/<id>/` - Update notebook
- `DELETE /api/notes/notebooks/<id>/` - Delete notebook

#### Blocks
- `GET /api/notes/notebooks/<id>/blocks/` - List notebook blocks
- `POST /api/notes/notebooks/<id>/blocks/` - Create block
- `PUT /api/notes/blocks/<id>/` - Update block
- `DELETE /api/notes/blocks/<id>/` - Delete block

## 🔐 Security Features

### Client-Side Encryption
The application implements a comprehensive client-side encryption system:

1. **Master Key Generation**: 256-bit AES key generated on device
2. **Key Derivation**: PBKDF2 with 600,000 iterations to derive key from password
3. **Content Encryption**: All note content encrypted with AES-GCM before transmission
4. **Secure Storage**: Master key only stored in memory, never persisted locally
5. **Salt & Nonce**: Unique random values for each encryption operation

### Authentication
- Token-based authentication
- Argon2 password hashing
- Optional TOTP 2FA
- Recovery keys for account access
- Secure session management

## 🎨 Customization

### Block Styling
Users can customize block appearance through:
- Global settings (applies to all blocks)
- Per-block settings (overrides global settings)

Customizable properties:
- Font family
- Font size
- Line height
- Text alignment
- Colors (text, background, border)
- Padding and margins

### Editor Preferences
- Theme selection
- Default block type
- Auto-save settings
- Keyboard shortcuts

## 📝 Development

### Code Structure

**Frontend Patterns:**
- React functional components with hooks
- TypeScript interfaces for type safety
- Context API for global state
- Singleton pattern for managers (CryptoManager, FrontendHub)
- Component composition for reusability

**Backend Patterns:**
- Django class-based views and function-based views
- DRF serializers for data validation
- Custom user model with manager
- Middleware for logging
- Singleton pattern for backend hub

### Logging

Both frontend and backend implement centralized logging:

**Frontend (FrontendHub):**
- Console logging with timestamps and emoji indicators
- Request/response tracking
- Error logging

**Backend (BackendHub):**
- File-based logging (`logs/api_YYYYMMDD.log`)
- Console logging with color coding
- Request/response details
- User tracking

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Django** and **Django REST Framework** for the robust backend framework
- **Next.js** and **React** for the modern frontend framework
- **Web Crypto API** for secure client-side cryptography
- **KaTeX** for beautiful math rendering
- **Cypress** for reliable E2E testing
- **Tailwind CSS** for rapid UI development

## 📞 Support

For questions, issues, or feature requests:
- **Users**: Check the [User Guide](docs/USER_GUIDE.md) for help with features and troubleshooting
- **Developers**: Review the [Testing Documentation](TESTING.md) and API docs
- Open an issue on GitHub for bugs or feature requests
- Review API documentation at `/api/schema/swagger-ui/`

## 🗺️ Roadmap

Future enhancements under consideration:
- [ ] Real-time collaborative editing
- [ ] Mobile applications (iOS/Android)
- [ ] Notebook sharing and permissions
- [ ] Version history and rollback
- [ ] Advanced search and tagging
- [ ] Plugin system for custom block types
- [ ] Markdown import/export improvements
- [ ] Cloud backup integration
- [ ] Dark mode theme
- [ ] Offline mode with sync

---

**Built with ❤️ using Django and Next.js**
