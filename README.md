# Life Compass – AI Career Guidance Platform

Life Compass is a full-stack web application that helps users discover suitable career paths and generate personalized learning roadmaps using AI. The platform combines user assessments, intelligent recommendations, and structured learning plans into one seamless experience.

---

## 🚀 Features

### 🔐 Authentication System

* User registration and login with JWT authentication
* Secure password hashing
* Forgot password with OTP via email
* Reset password functionality

### 🧭 Career Purpose Assessment

* Multi-step interactive assessment:

  * Location preference (India / International)
  * Career category selection
  * Education level
  * Personalized questions (AI-generated)
* Collects user inputs to understand interests, skills, and goals

### 🤖 AI Career Recommendations

* Uses OpenAI API to generate:

  * Personalized career suggestions
  * Match percentage for each career
  * Detailed role descriptions

### 🛣️ AI Roadmap Generator

* Generates structured learning roadmaps based on:

  * Career choice
  * Knowledge level
  * Timeline
  * User goals
* Includes:

  * Skills to learn
  * Weekly/monthly breakdown
  * Projects
  * Tools & technologies
  * Certifications

### 📚 Roadmap History

* Stores generated roadmaps in user profile
* View, manage, and reuse past roadmaps

---

## 🏗️ Tech Stack

### Frontend

* React (JavaScript + TypeScript)
* React Router
* Axios / Fetch API
* CSS

### Backend

* Flask (Python)
* SQLAlchemy (SQLite database)
* JWT Authentication
* OpenAI API
* SMTP (Email for OTP)

---

## 📂 Project Structure

```
project-root/
│
├── backend/
│   ├── app.py
│   └── database (SQLite)
│
├── frontend/
│   ├── App.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── assessment/
│   │   │   └── AssessmentSteps.jsx
│   │   ├── roadmap/
│   │   │   └── RoadmapGenerator.jsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── Purpose.jsx
│
└── README.md
```

---

## ⚙️ How It Works

1. User signs up or logs in
2. Starts the **Career Assessment**
3. Answers AI-generated questions
4. Gets **personalized career recommendations**
5. Selects a career → generates **AI roadmap**
6. Saves roadmap to profile for future use

---

## 🔌 Backend API Endpoints

### Authentication

* `POST /auth/register` → Register user
* `POST /auth/login` → Login and get JWT
* `POST /auth/forgot-password` → Send OTP
* `POST /auth/reset-password` → Reset password
* `GET/PUT /auth/profile` → Get/update profile

### Career Purpose

* `GET /purpose/location` → Get location options
* `GET /purpose/categories` → Get career categories
* `GET /purpose/education-level` → Get education levels
* `GET /purpose/questions` → Generate AI questions
* `POST /purpose/recommend` → Get career recommendations (JWT required)

### Roadmap

* `POST /roadmap/generate` → Generate roadmap (JWT required)
* `GET /roadmap/history` → Get roadmap history

---

## 🧠 AI Integration

The application uses OpenAI API to:

* Generate career assessment questions
* Provide personalized career recommendations
* Create structured learning roadmaps

---

## 🔐 Authentication Flow

* JWT tokens are issued on login
* Stored in localStorage on frontend
* Protected routes require Bearer token
* Backend verifies token using Flask-JWT-Extended

---

## 📧 OTP Email System

* OTP is generated and stored temporarily
* Sent via SMTP (Gmail)
* Valid for 10 minutes
* Used for password reset

---

## ▶️ Running the Project

### Backend

```bash
pip install -r requirements.txt
python app.py
```

Runs on:

```
http://localhost:5000
```

---

### Frontend

```bash
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## 🔑 Environment Variables

Create a `.env` file in backend:

```
OPENAI_API_KEY=your_openai_key
JWT_SECRET_KEY=your_secret_key
SENDER_EMAIL=your_email@gmail.com
SENDER_EMAIL_PASSWORD=your_app_password
```

---

## 📌 Key Design Decisions

* **Modular architecture** using Flask Blueprints
* **Separation of concerns** between frontend and backend
* **JWT-based authentication** for secure APIs
* **AI-driven personalization** instead of static logic
* **Profile-based storage** for user roadmaps

---

## 🚧 Future Improvements

* Add role-based authentication
* Improve AI response structuring (JSON format)
* Add dashboard analytics
* Deploy on cloud (AWS / Vercel / Render)
* Add resume-based recommendations

---

## 📖 Use Case

This platform is useful for:

* Students confused about career paths
* Beginners entering tech or other fields
* Anyone needing structured learning plans

---

## 👨‍💻 Author

Akash Rangarej
