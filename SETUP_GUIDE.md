# 🚀 HRMS - Complete Setup Guide

This guide will walk you through setting up and running the HR Management System.

## Prerequisites

Make sure you have these installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/download/win)

## ✅ Verify Installations

```bash
# Check Node.js version
node -v

# Check npm version
npm -v

# Check MongoDB version (if installed locally)
mongod --version
```

---

## 📦 Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd HRMS_MERN/backend
```

### Step 2: Install Dependencies

All dependencies are already installed, but you can reinstall if needed:

```bash
npm install
```

**Installed packages:**

- express - Web framework
- mongoose - MongoDB ODM
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- cors - Cross-origin requests
- dotenv - Environment variables
- nodemailer - Email sending
- twilio - SMS sending
- nodemon - Auto-reload during development

### Step 3: Setup Environment Variables

Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hrms

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 4: Start MongoDB

**Option 1: Local MongoDB**

```bash
# Windows (in Command Prompt or PowerShell)
mongod

# Mac/Linux
brew services start mongodb-community
# or
mongod
```

**Option 2: MongoDB Atlas (Cloud)**

- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster
- Get your connection string
- Update MONGODB_URI in .env

### Step 5: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:

```
✅ MongoDB connected
🚀 Server running on port 5000
```

**Backend Base URL:** `http://localhost:5000`

---

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd HRMS_MERN/frontend
```

### Step 2: Install Dependencies

Axios and React Router are already installed. If needed:

```bash
npm install
```

**Installed packages:**

- react - UI library
- react-dom - React DOM
- react-router-dom - Routing
- axios - HTTP client
- vite - Build tool

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:

```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
```

**Frontend URL:** `http://localhost:5173`

---

## 🧪 Testing the Application

### Step 1: Open Browser

Navigate to `http://localhost:5173`

### Step 2: Register a New Account

1. Click "Register"
2. Enter full name, email, phone, password
3. Password requirements:
   - At least 6 characters
   - One uppercase letter
   - One lowercase letter
   - One special character
4. Click "Send OTP"
5. Check your email for OTP (or console if using test mode)
6. Enter OTP and complete registration

### Step 3: Login

1. Use registered email and password
2. Click "Sign In"
3. You'll be redirected to Dashboard

### Step 4: Explore Features

**As User:**

- View Dashboard
- Check Attendance
- View Employee List
- Apply for Leaves
- View Payroll
- Generate Reports
- Update Settings

**As Admin:**

- All user features +
- Admin Quick Actions
- Manage Employees
- Process Payroll
- Approve/Reject Leaves

---

## 📝 Sample Test Credentials

### Pre-created Test Account (if using mock data)

**Admin Account:**

- Email: `admin@example.com`
- Password: `Admin@123`
- Role: Admin

**User Account:**

- Email: `user@example.com`
- Password: `User@123`
- Role: User

---

## 🔗 API Endpoints

### Authentication Endpoints

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login user        |
| GET    | `/api/auth/me`       | Get current user  |
| PUT    | `/api/auth/profile`  | Update profile    |

### HR Endpoints

| Method | Endpoint      | Description            |
| ------ | ------------- | ---------------------- |
| POST   | `/api/hr`     | Create HR record       |
| GET    | `/api/hr`     | Get all/own HR records |
| GET    | `/api/hr/:id` | Get specific record    |
| PUT    | `/api/hr/:id` | Update HR record       |
| DELETE | `/api/hr/:id` | Delete HR record       |

### Reports Endpoints

| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| POST   | `/api/reports`     | Create report       |
| GET    | `/api/reports`     | Get all/own reports |
| GET    | `/api/reports/:id` | Get specific report |
| PUT    | `/api/reports/:id` | Update report       |
| DELETE | `/api/reports/:id` | Delete report       |

### Settings Endpoints

| Method | Endpoint            | Description       |
| ------ | ------------------- | ----------------- |
| GET    | `/api/settings`     | Get user settings |
| PUT    | `/api/settings`     | Update settings   |
| GET    | `/api/settings/all` | Get all settings  |

---

## 🧠 Using Postman for API Testing

### Step 1: Install Postman

Download from [postman.com](https://www.postman.com/downloads/)

### Step 2: Create Request

Example: Register User

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "Test@1234",
  "role": "User"
}
```

### Step 3: Add Authorization Header (for protected routes)

1. Go to "Headers" tab
2. Add:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN_HERE`

### Step 4: Send Request

Click "Send" to test the API

---

## 🚨 Troubleshooting

### Issue: MongoDB Connection Error

**Error:** `connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**

```bash
# Make sure MongoDB is running
mongod

# Or update MONGODB_URI in .env to use MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms
```

---

### Issue: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**

```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env to 5001
PORT=5001
```

---

### Issue: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**

- Ensure `FRONTEND_URL` is correct in backend .env
- Check backend has `cors()` enabled
- Verify frontend is calling correct API URL

---

### Issue: OTP Not Sending

**Error:** `OTP send failed`

**Solution:**

1. Check email credentials in .env
2. For Gmail: Use App Password, not account password
3. For Twilio: Verify credentials are correct
4. Check browser console for error details

---

### Issue: JWT Token Expired

**Error:** `Invalid token` or `401 Unauthorized`

**Solution:**

```bash
# Login again to get new token
# Token is valid for 7 days
# Check JWT_SECRET in .env
```

---

## 🔐 Security Best Practices

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update email credentials with secure app password
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for sensitive data
- [ ] Add rate limiting middleware
- [ ] Enable request validation
- [ ] Add CSRF protection
- [ ] Use helmet.js for security headers

---

## 📚 Project Structure

```
HRMS_MERN/
├── backend/
│   ├── models/         # Database schemas
│   ├── controllers/    # Business logic
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth, error handling
│   ├── .env           # Environment variables
│   ├── server.js      # Main server file
│   └── package.json   # Dependencies
│
└── frontend/
    ├── src/
    │   ├── Pages/     # Page components
    │   ├── components/ # Reusable components
    │   ├── services/  # API calls
    │   ├── context/   # State management
    │   ├── styles/    # CSS files
    │   └── utils/     # Helper functions
    └── package.json   # Dependencies
```

---

## 📞 Support

### Common Issues Reference

1. **Can't connect to database?** → Check MongoDB is running
2. **API not responding?** → Check backend is running on port 5000
3. **Login not working?** → Check credentials and JWT_SECRET
4. **Styling not loading?** → Clear browser cache and refresh

---

## 🚀 Next Steps

1. ✅ Setup backend and database
2. ✅ Setup frontend
3. ✅ Register test account
4. ✅ Login and explore features
5. ⬜ Integrate with real database (if needed)
6. ⬜ Add more features
7. ⬜ Deploy to production

---

## 📖 Documentation Links

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [React Documentation](https://react.dev/)
- [JWT Documentation](https://jwt.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## ✨ Tips & Tricks

### Useful Commands

```bash
# Backend
npm run dev          # Start development server
npm run start        # Start production server

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
mongod               # Start MongoDB locally
mongo               # Connect to MongoDB shell
```

### Keyboard Shortcuts

- `Ctrl + Shift + I` - Open browser DevTools
- `F12` - Toggle DevTools
- `Ctrl + R` - Reload page
- `Ctrl + Shift + R` - Hard reload (clear cache)

---

## 🎉 You're All Set!

Your HR Management System is now ready to use. Happy coding!

If you have any questions or run into issues, check the [README.md](./README.md) file for more detailed information.

---

**Last Updated:** February 2026
**Version:** 1.0.0
