# Next Generation Database - Resume Analyzer

An AI-powered ATS (Applicant Tracking System) Resume Analyzer built with **Next.js**, **MongoDB**, and **Google Gemini AI**.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally on another machine.

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) installed on your system.
- Download Node.js: [https://nodejs.org/](https://nodejs.org/)

---

### 2. Clone the Repository
```bash
git clone https://github.com/BhumikaShelar/Next-Generation-DB.git
cd Next-Generation-DB
```

---

### 3. Install Dependencies
Install all required Node.js packages:
```bash
npm install
```

---

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory by copying the template file:

```bash
# On Linux/macOS:
cp .env.example .env.local

# On Windows (PowerShell):
copy .env.example .env.local
```

Open `.env.local` in your editor and add your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=your_session_secret
```

---

### 5. Run the Application

#### Development Mode (Recommended for testing):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

#### Production Mode:
```bash
npm run build
npm start
```

---

## 📁 Project Structure

- `src/app/` - Next.js App Router pages and API routes (`/api/analyze`, `/api/auth`, `/api/resumes`)
- `src/lib/` - MongoDB connection (`db.js`), Gemini AI service (`gemini.js`), Auth utilities (`auth.js`)
- `src/lib/models/` - Mongoose database schemas (`User.js`, `Resume.js`)
- `.env.example` - Template for environment variables (safe for git)
- `.gitignore` - Protects sensitive files, credentials, and build artifacts
