# 🎓 SkillBridge — Academic Learning Effectiveness Platform

A full-stack, production-ready academic platform with role-based access for **Students**, **Teachers/Faculty**, and **Admins**. Built with React, Node.js, Express, MongoDB Atlas, Socket.io, and Cloudinary.

---

## 🏗️ Project Structure

```
skillbridge/
├── backend/          ← Node.js + Express API
│   ├── models/       ← Mongoose schemas
│   ├── routes/       ← API route handlers
│   ├── middleware/   ← Auth + upload middleware
│   ├── server.js     ← Entry point
│   ├── seed.js       ← Demo data seeder
│   └── .env.example
├── frontend/         ← React 18 SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/   ← 10 student pages
│   │   │   ├── teacher/   ← 9 teacher pages
│   │   │   └── admin/     ← 5 admin pages
│   │   ├── components/
│   │   ├── context/       ← Auth + Socket context
│   │   └── utils/api.js   ← All API calls
│   └── .env.example
├── package.json      ← Root scripts
├── Procfile          ← For Render/Railway/Heroku
└── README.md
```

---

## ✨ Features

### 👩‍🎓 Student
- **Dashboard** — Welcome banner, study heatmap, to-do list, active course count, assignment deadlines, quick actions
- **All Courses** — Browse, search, filter by category/level, enroll with one click
- **My Courses** — View enrolled courses, unenroll
- **Assignments** — View pending/overdue/submitted, upload file submission (PDF, DOC, ZIP etc.)
- **Progress** — Study heatmap (12-week), log daily study time, streak counter
- **Quizzes** — Attend live quizzes with countdown timer, see result immediately after submission
- **Certificates** — Upload certifications, track verification status from teachers
- **Messages** — Chat with any teacher for doubt clarification (real-time via Socket.io)
- **Notifications** — Receive real-time push notifications from teachers/admins with full history
- **Profile** — Edit info, change password

### 👨‍🏫 Teacher / Faculty
- **Dashboard** — Course stats, student count, pending grades, recent submissions, live quiz count
- **My Courses** — Create, edit, delete courses with category/level/color/tags
- **Students** — View all enrolled students with course details, search/filter
- **Assignments** — Create with deadline, view all submissions, grade with feedback (sends notification)
- **Quizzes** — Create multi-choice quizzes with timer, start/stop live sessions, view per-student results
- **Certificates** — View all certificates uploaded by enrolled students, verify them
- **Messages** — Real-time chat with students
- **Notifications** — View all notifications with read/unread status
- **Profile** — Edit bio/contact, change password

### 🛡️ Admin
- **Dashboard** — Total students/teachers/admins/courses/enrollments/assignments/quizzes counts, recent users
- **Users** — Full CRUD: add/edit/deactivate students, teachers, and admins; search & filter by role
- **Courses** — View and delete any course platform-wide
- **Announcements** — Broadcast notifications to all users, specific roles; view sent history
- **Profile** — Edit info, change password

### 🔧 Extra Features
- Real-time messaging (Socket.io)
- Real-time push notifications
- File uploads via Cloudinary (assignments, certificates)
- JWT authentication with auto-refresh
- Study activity heatmap (GitHub-style)
- Pastel color theme with Sora + Plus Jakarta Sans fonts
- Fully responsive design
- Role-based route protection

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone / extract the project
```bash
cd skillbridge
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/skillbridge
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Configure Frontend
```bash
cd frontend
cp .env.example .env
```
Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Install dependencies
```bash
# From project root
npm run install-all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 5. Seed demo data
```bash
cd backend
npm run seed
```
This creates:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Teacher | teacher@demo.com | demo123 |
| Student | student@demo.com | demo123 |

### 6. Run development servers
```bash
# From root (runs both simultaneously)
npm run dev
```
Or separately:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

Open http://localhost:3000

---

## ☁️ Deployment to Render (Recommended — Free)

### Backend on Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `node backend/server.js`
   - **Root Directory:** leave blank (use repo root)
5. Add all environment variables from `backend/.env.example`:
   - `MONGODB_URI` ← your Atlas connection string
   - `JWT_SECRET` ← random string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `NODE_ENV=production`
   - `CLIENT_URL` ← your frontend URL (add after frontend deploy)
6. Deploy!

### Frontend on Vercel (or Netlify)
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repo
3. Settings:
   - **Framework:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. Environment variables:
   - `REACT_APP_API_URL=https://your-backend.onrender.com/api`
   - `REACT_APP_SOCKET_URL=https://your-backend.onrender.com`
5. Deploy!
6. Copy the Vercel URL → go back to Render → update `CLIENT_URL`

### Alternative: Single Server Deploy on Render
Build the frontend and serve it from Express:
1. Set `NODE_ENV=production` in Render env vars
2. Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
3. Start command: `node backend/server.js`
The Express server will serve the React build from `/frontend/build`

---

## 🌐 MongoDB Atlas Setup
1. Create free account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a **free M0 cluster**
3. Database Access → Add user (username + password)
4. Network Access → Add IP **0.0.0.0/0** (allow all, for cloud deploy)
5. Clusters → Connect → **Connect your application**
6. Copy the connection string, replace `<password>` with your DB user password
7. Add `/skillbridge` before the `?` in the connection string

---

## ☁️ Cloudinary Setup
1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Dashboard → copy **Cloud Name**, **API Key**, **API Secret**
3. Add to your `.env` / Render environment variables

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/courses | All courses |
| POST | /api/courses | Create course (teacher) |
| POST | /api/courses/:id/enroll | Enroll (student) |
| GET | /api/assignments/student | Student assignments |
| POST | /api/assignments/:id/submit | Submit assignment |
| PUT | /api/assignments/:id/grade/:sid | Grade submission |
| GET | /api/quizzes/student | Student quizzes |
| POST | /api/quizzes/:id/submit | Submit quiz |
| GET | /api/messages/conversations | Conversations |
| POST | /api/messages | Send message |
| GET | /api/notifications | Get notifications |
| POST | /api/notifications/broadcast | Broadcast |
| POST | /api/certificates/upload | Upload cert |
| GET | /api/admin/stats | Admin dashboard stats |
| GET | /api/admin/users | All users |
| POST | /api/admin/announce | Send announcement |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6 |
| Styling | Pure CSS with CSS Variables (pastel theme) |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.io |
| File Upload | Multer + Cloudinary |
| Notifications | Toast (react-hot-toast) |
| Fonts | Sora + Plus Jakarta Sans (Google Fonts) |

---

## 📄 License
MIT — free for personal and commercial use.
