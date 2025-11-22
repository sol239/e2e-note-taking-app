# E2E Note Taking App

A modern, modular, and block-based note-taking application designed for flexibility and developer productivity. Built with a robust Django backend and a cutting-edge Next.js frontend.

## 🚀 Key Features

*   **🧱 Modular Block System:** Compose notes using a variety of blocks including Text, Code, Images, Audio, Video, and Grid layouts.
*   **📝 Rich Text & Math Support:** Full Markdown editing capabilities with **KaTeX** support for rendering complex mathematical expressions.
*   **💻 Live Code Editor:** Integrated code blocks with syntax highlighting and live editing capabilities.
*   **📚 Notebook Organization:** Organize your thoughts, projects, and ideas into dedicated notebooks.
*   **🔐 Secure Authentication:** User registration and login system to keep your notes private and personalized.
*   **🎨 Modern UI/UX:** A clean, responsive, and dark-mode friendly interface built with **Tailwind CSS v4**.
*   **📤 Export Options:** Export your notes to share or backup your data.

## 🛠️ Tech Stack

### Frontend
*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **Library:** [React 19](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Editor Components:** `@uiw/react-md-editor`, `react-simple-code-editor`

### Backend
*   **Framework:** [Django](https://www.djangoproject.com/)
*   **API:** [Django REST Framework](https://www.django-rest-framework.org/)
*   **Documentation:** [drf-spectacular](https://drf-spectacular.readthedocs.io/) (OpenAPI 3.0)
*   **Database:** SQLite (Default, easily swappable for PostgreSQL)
*   **Authentication:** Custom User Model with Argon2 hashing

## 🏁 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   **Python** (v3.10 or higher)
*   **Node.js** (v18 or higher)
*   **npm** or **yarn**

### 1. Backend Setup

Navigate to the backend directory and set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal, navigate to the frontend directory, and start the Next.js app.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📖 API Documentation

When the backend server is running, you can access the interactive API documentation (Swagger UI) to explore the available endpoints:

*   **Swagger UI:** `http://localhost:8000/api/schema/swagger-ui/`

## 📂 Project Structure

```
e2e-note-taking-app/
├── backend/                # Django Backend
│   ├── accounts/           # User authentication & management
│   ├── notes/              # Core note-taking logic (Notebooks, Blocks)
│   ├── notetaking/         # Project settings & configuration
│   ├── manage.py           # Django CLI utility
│   └── requirements.txt    # Python dependencies
│
└── frontend/               # Next.js Frontend
    ├── src/
    │   ├── app/            # Next.js App Router pages
    │   ├── components/     # Reusable UI components (Blocks, Editors)
    │   ├── models/         # TypeScript interfaces & types
    │   └── api/            # API integration logic
    ├── public/             # Static assets
    └── package.json        # Node.js dependencies
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
