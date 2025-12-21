Startup Connect Hub 🚀
A full-stack platform connecting startup founders with talented co-founders and professionals. Built with Django (backend) and React + Vite (frontend).

📋 Features
✅ Implemented (Phases 1-4)
Authentication & Profiles (Phase 1)
JWT-based email/password authentication
Role-based access (Founder/Talent)
Extended profiles with skills, experience, social links
Startup Management (Phase 2)
Full CRUD operations for startups
Founder-only creation
Rich startup profiles (industry, stage, website)
Startup Discovery (Phase 3)
Browse all startups
Filter by industry and stage
Pagination support
Interest System (Phase 4)
Talent can express interest in startups
Founders can view interested candidates
Interest tracking and management
🛠 Tech Stack
Backend
Django 4.2.7
Django REST Framework
JWT Authentication (djangorestframework-simplejwt)
SQLite (default, PostgreSQL-ready)
CORS configured
Frontend
React 18.3.1
TypeScript 5.8.3
Vite 5.4.19
Tailwind CSS 3.4.17
Shadcn UI components
React Router 6.30.1
📦 Installation
Prerequisites
Python 3.10+
Node.js 18+
npm or yarn
Backend Setup
Navigate to backend directory
bash
   cd backend
Create virtual environment
bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
Install dependencies
bash
   pip install -r requirements.txt
Configure environment (optional)
bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env and set:
   # - SECRET_KEY (generate new one for production)
   # - DEBUG (False in production)
   # - ALLOWED_HOSTS (your domain)
Run migrations
bash
   python manage.py migrate
Create superuser (optional)
bash
   python manage.py createsuperuser
Start development server
bash
   python manage.py runserver
Backend will run at http://localhost:8000

Frontend Setup
Navigate to frontend directory
bash
   cd .. # from backend directory
Install dependencies
bash
   npm install
Configure environment
bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env and set:
   VITE_API_BASE_URL=http://localhost:8000/api
Start development server
bash
   npm run dev
Frontend will run at http://localhost:5173

🚀 Production Deployment
Backend
Set environment variables
bash
   export SECRET_KEY='your-secret-key'
   export DEBUG=False
   export ALLOWED_HOSTS='yourdomain.com'
Collect static files
bash
   python manage.py collectstatic
Use production WSGI server
bash
   pip install gunicorn
   gunicorn startup_platform.wsgi:application
Frontend
Set production API URL
bash
   # In .env or build environment
   VITE_API_BASE_URL=https://api.yourdomain.com/api
Build for production
bash
   npm run build
Serve dist/ folder
Use Nginx, Apache, or CDN
Ensure proper routing for SPA
📝 Environment Variables
Backend (.env)
env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3  # Optional
Frontend (.env)
env
VITE_API_BASE_URL=http://localhost:8000/api
🏗 Project Structure
startup-connect-hub/
├── backend/
│   ├── accounts/          # User authentication & profiles
│   ├── startups/          # Startup CRUD & interests
│   ├── startup_platform/  # Django settings
│   ├── manage.py
│   └── requirements.txt
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth)
│   ├── lib/              # Utilities (API client, config)
│   ├── pages/            # Route pages
│   ├── types/            # TypeScript definitions
│   └── main.tsx
├── .env.example
├── package.json
└── README.md
🔧 Development
Running Tests
Backend

bash
cd backend
python manage.py test
Frontend

bash
npm run test  # Add test script as needed
Code Quality
Backend

bash
# Format with black
black .

# Lint with flake8
flake8
Frontend

bash
# Lint
npm run lint

# Type check
npm run type-check
📚 API Documentation
Authentication
POST /api/auth/register/ - Register new user
POST /api/auth/login/ - Login
GET /api/auth/me/ - Get current user
PUT /api/auth/me/ - Update current user
POST /api/auth/token/refresh/ - Refresh JWT token
Profiles
GET /api/profiles/<id>/ - Get user profile
GET /api/profiles/me/ - Get current user's profile
PUT /api/profiles/me/ - Update current user's profile
Startups
GET /api/startups/ - List all startups (paginated)
POST /api/startups/ - Create startup (founder only)
GET /api/startups/my/ - Get my startups
GET /api/startups/<id>/ - Get startup details
PUT /api/startups/<id>/ - Update startup (owner only)
DELETE /api/startups/<id>/ - Delete startup (owner only)
Interests
POST /api/startups/<id>/interest/ - Express interest (talent)
DELETE /api/startups/<id>/interest/ - Withdraw interest
GET /api/startups/<id>/interests/ - View interests (founder/owner)
GET /api/my/interests/ - My interests (talent)
🤝 Contributing
Fork the repository
Create feature branch (git checkout -b feature/amazing)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing)
Open Pull Request
📄 License
This project is licensed under the MIT License.

🐛 Known Issues
None currently. Report issues at: https://github.com/jagan25-mj/startup-connect-hub/issues

🎯 Roadmap
 Phase 5: Advanced matching algorithms
 Phase 6: Messaging system
 Phase 7: Investment tracking
 Phase 8: Analytics dashboard
💬 Support
For questions or support:

Open an issue on GitHub
Contact: [Your Email]
Made with ❤️ by the Startup Connect Hub team

