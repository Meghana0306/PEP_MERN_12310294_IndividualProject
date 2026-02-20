# 🔐 HRMS Login Flow Guide

## Updated Registration & Login Flows

### 📝 REGISTRATION FLOW

**Step 1: Register Page**

- Click **"Register"** link on Login page
- Fill in:
  - Full Name
  - Email
  - Phone (10 digits)
  - Password (Must contain capital, small letter, symbol, 6+ chars)
- Click **"Send OTP"** button

**Step 2: OTP Verification**

- Enter the **4-digit OTP** sent to your email
- Click **"Verify & Register"** button
- ✅ You'll be automatically logged in and redirected to **Dashboard**

---

### 🔑 LOGIN FLOW (Password)

**Option 1: Standard Login**

- Enter Email
- Enter Password
- Click **"Sign In"** button
- ✅ Redirected to **Dashboard**

---

### 📧 LOGIN FLOW (OTP)

**Step 1: Request OTP**

- Click **"Login with OTP"** link
- Enter your Email
- Click **"Send OTP"** button

**Step 2: Verify OTP**

- Enter **4-digit OTP** from your email
- Click **"Verify & Login"** button
- ✅ Redirected to **Dashboard**

---

## 🎯 Key Features

| Feature               | Details                                     |
| --------------------- | ------------------------------------------- |
| Email Verification    | OTP sent via Gmail to verify email          |
| Password Requirements | Capital + small + symbol + 6+ characters    |
| Auto-Login            | After registration, automatically logged in |
| OTP Resend            | Can resend OTP if not received              |
| Go Back               | Can go back to previous step if needed      |

---

## 🚀 Testing Credentials

You can manually test using the `/send-otp` API:

```bash
POST http://localhost:5000/send-otp
Content-Type: application/json

{
  "email": "your_email@gmail.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

The OTP will also be printed in the **backend console** for development testing.

---

## ⚙️ Environment Setup

For emails to work properly, configure in `.env`:

```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here
```

**Getting Gmail App Password:**

1. Enable 2FA on Google Account
2. Go to Google Account Settings → Security → App Passwords
3. Select Mail & Windows Computer
4. Generate & copy the 16-character password
5. Paste in `.env` as `EMAIL_PASS`

---

## 🐛 Troubleshooting

| Issue                     | Solution                                             |
| ------------------------- | ---------------------------------------------------- |
| OTP not received          | Check spam folder, verify email in .env is correct   |
| Login not working         | Ensure backend is running on port 5000               |
| Password validation fails | Must include: uppercase, lowercase, symbol, 6+ chars |
| Can't verify OTP          | Check that OTP matches (printed in backend console)  |

---

## 📱 After Login

Once logged in, you'll see:

- ✅ **Dashboard** - Overview of HR data
- ✅ **Attendance** - Track attendance records
- ✅ **Employees** - Manage employee list (Admin)
- ✅ **Leave Management** - Apply & manage leaves
- ✅ **Payroll** - View salary details
- ✅ **Reports** - Generate HR reports (Admin)
- ✅ **Settings** - Configure preferences
- ✅ **Logout** - Sign out from your account

---

**Version:** 1.0  
**Last Updated:** February 2026
