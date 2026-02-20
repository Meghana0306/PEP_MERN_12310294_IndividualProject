# HR Management System (HRMS) - MERN Stack

A complete **HR Management System** built with the MERN stack (MongoDB, Express, React, Node.js) featuring JWT authentication, role-based access control, and comprehensive HR management features.

## 🚀 Features

### Authentication & Authorization

- ✅ User Registration with OTP verification
- ✅ User Login with JWT tokens
- ✅ Login with OTP
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control (Admin/User)
- ✅ Protected routes with middleware

### Main Modules

1. **Users Management** - Admin and User roles
2. **HR Management** - Employee records, leaves, performance ratings
3. **Reports** - Attendance, Performance, Payroll, Leave reports
4. **Settings** - User preferences, privacy, notifications

### REST APIs

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

#### HR Management

- `POST /api/hr` - Create HR record (Admin only)
- `GET /api/hr` - Get all HR records (Admin) or own (User)
- `GET /api/hr/:id` - Get specific HR record
- `PUT /api/hr/:id` - Update HR record (Admin only)
- `DELETE /api/hr/:id` - Delete HR record (Admin only)

#### Reports

- `POST /api/reports` - Create report (Admin only)
- `GET /api/reports` - Get all reports (Admin) or own (User)
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report (Admin only)
- `DELETE /api/reports/:id` - Delete report (Admin only)

#### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `GET /api/settings/all` - Get all users settings (Admin only)

#### OTP Services

- `POST /send-otp` - Send OTP via email/SMS
- `POST /verify-otp` - Verify OTP

## 📁 Project Structure

```
HRMS_MERN/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── HR.js
│   │   ├── Reports.js
│   │   └── Settings.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── hrController.js
│   │   ├── reportsController.js
│   │   └── settingsController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── hrRoutes.js
│   │   ├── reportsRoutes.js
│   │   └── settingsRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── Pages/
    │   │   ├── Login.jsx
    │   │   ├── OtpVerify.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Attendance.jsx
    │   │   ├── Employee.jsx
    │   │   ├── EmployeeForm.jsx
    │   │   ├── LeaveManagement.jsx
    │   │   ├── Payroll.jsx
    │   │   ├── Reports.jsx
    │   │   ├── Settings.jsx
    │   │   └── NotFound.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── utils/
    │   │   └── ProtectedRoute.jsx
    │   ├── styles/
    │   │   ├── login.css
    │   │   ├── dashboard.css
    │   │   ├── navbar.css
    │   │   ├── pages.css
    │   │   ├── notfound.css
    │   │   └── App.css
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

## 🔐 JWT Authentication Flow

1. **User Registers** → Password is hashed and saved
2. **User Logs In** → Server generates JWT token
3. **Token Stored** → Frontend stores token in localStorage
4. **Authorization Header** → Token sent with every request
5. **Backend Verification** → Middleware verifies token and role
6. **Access Control** → If valid → Allow, else → 401 Unauthorized

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending
- **Twilio** - SMS sending
- **dotenv** - Environment variables

### Frontend

- **React** - UI library
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Context API** - State management

## 📦 Installation

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
# - MongoDB URI
# - JWT Secret
# - Email credentials
# - Twilio credentials

# Start the server
npm start
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## 🔑 Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
FRONTEND_URL=http://localhost:5173
```

## 🧪 Sample API Requests

### Register User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "Admin@123",
  "role": "User"
}
```

### Login User

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Admin@123"
}
```

### Create HR Record (Admin only)

```bash
POST http://localhost:5000/api/hr
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id_here",
  "employeeId": "EMP001",
  "leaveBalance": 20,
  "performanceRating": 4
}
```

## 🎨 UI Features

- **Responsive Design** - Works on all devices
- **Modern Dashboard** - Beautiful stats and cards
- **Data Tables** - View and manage employee records
- **Forms** - Add/Edit employees and records
- **Status Badges** - Visual indicators for status
- **Navigation Bar** - Easy access to all features
- **Dark/Light Theme Support** - User preference in settings

## 👥 User Roles

### Admin

- ✅ Manage all employees
- ✅ View all HR records
- ✅ Generate reports
- ✅ Approve/Reject leave requests
- ✅ Update payroll
- ✅ View all settings

### User

- ✅ View own profile
- ✅ View own HR records
- ✅ Apply for leaves
- ✅ View own payroll
- ✅ View own reports
- ✅ Update own settings

## 📝 API Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Error Response

```json
{
  "message": "Error message here",
  "error": "Detailed error"
}
```

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Role-based authorization
- ✅ Environment variables for sensitive data
- ✅ CORS enabled
- ✅ Error handling middleware

## 🐛 Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env

### JWT Token Errors

- Verify JWT_SECRET is set in .env
- Check token expiration time
- Ensure token is sent in Authorization header

### CORS Errors

- Verify FRONTEND_URL in backend .env
- Check Access-Control headers

## 🚀 Deployment

### Backend (Heroku/Railway)

```bash
git push heroku main
```

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy the dist folder
```

For Netlify, set `VITE_API_BASE_URL` to your deployed backend URL in Site Environment Variables.

## 📚 API Documentation

Full API documentation available at `/api/docs`

## 📄 License

MIT License

## 👨‍💼 Author

Your Name

---

**Happy Coding! 🎉**
