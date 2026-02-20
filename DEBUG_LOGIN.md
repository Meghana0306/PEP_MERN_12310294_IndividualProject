# 🔍 Login Debugging Guide

## What Changed

I've added **detailed console logging** to help debug the login flow. Here's what to do:

---

## 📋 Step-by-Step Debug Process

### **Step 1: Open Browser Developer Tools**

1. Navigate to: `http://localhost:5174`
2. Press **F12** or **Right-click → Inspect**
3. Click **Console** tab
4. Keep it open while testing

---

### **Step 2: Test Login and Watch Console**

Follow these steps and watch the console output:

1. **On Login Page:**
   - Enter Email: `test@example.com`
   - Enter Password: `Test@123`
   - Click **"Sign In"**

2. **Watch for These Console Messages:**

```
🔐 Attempting login with: test@example.com
📤 Sending login request to backend...
📥 Login response received: {token: "...", user: {...}}
💾 Storing token and user in localStorage...
🔄 Updating state...
✅ Login complete. State updated.
  - Token: eyJhbGciOiJIUzI1NiIs...
  - User: {id: "...", name: "Test User", email: "..."}

🔒 ProtectedRoute Check:
  - isAuthenticated: true
  - user: {id: "...", name: "Test User", ...}
  - loading: false
  - requiredRole: null

✅ Access granted to: Dashboard
```

---

## ✅ Expected Flow

If everything works, you'll see:

1. ✅ Login request sends
2. ✅ Receives token & user
3. ✅ Stores in localStorage
4. ✅ State updates
5. ✅ ProtectedRoute grants access
6. ✅ **Dashboard appears** ✨

---

## ❌ Troubleshooting

### **Issue: Still seeing Login Page after Sign In**

**Check 1: Backend Connected?**

- Look for: `📤 Sending login request to backend...`
- If not appearing → Backend not running
- Fix: `cd backend && node server.js`

**Check 2: Login Response Received?**

- Look for: `📥 Login response received:`
- If not appearing → Check backend error
- Look in backend console for error message

**Check 3: Token Stored?**

- Look for: `💾 Storing token and user in localStorage...`
- If not appearing → Login API failed
- Check the backend response

**Check 4: State Updated?**

- Look for: `✅ Login complete. State updated.`
- If not appearing → Something blocked state update
- Check for React errors above in console

**Check 5: Protected Route Allowed Access?**

- Look for: `✅ Access granted to: Dashboard`
- If seeing: `❌ Not authenticated, redirecting to login`
- This means `isAuthenticated` is false
- Check localStorage has token: Open DevTools → Application → LocalStorage → Check "token"

---

## 🔧 Manual Verification

### **Check localStorage**

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **LocalStorage** → `http://localhost:5174`
4. You should see:
   - `token`: "eyJ..." (long string)
   - `user`: `{"id":"...","name":"Test User",...}`

If these are empty → Login didn't save properly

### **Check Network Tab**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try login
4. Look for request: `POST /api/auth/login`
5. Click it → Response tab
6. Should show: `{"token":"...","user":{...}}`

If you see error → Check backend console

---

## 🆘 If Still Not Working

**Send me the Console Output:**

1. After trying to login, copy everything from console
2. Look for error messages (red text)
3. Tell me what errors you see

**Common Errors:**

| Error                         | Cause               | Fix                                  |
| ----------------------------- | ------------------- | ------------------------------------ |
| `Invalid email or password`   | Wrong credentials   | Use `test@example.com` / `Test@123`  |
| `Network Error`               | Backend not running | Start backend: `node server.js`      |
| `Cannot POST /api/auth/login` | Backend route issue | Check `backend/routes/authRoutes.js` |
| `CORS error`                  | Cross-origin issue  | Backend CORS settings wrong          |
| `next is not a function`      | Mongoose hook error | Restart backend                      |

---

## 📝 Test Credentials (Working)

```
Email:    test@example.com
Password: Test@123

OR

Email:    admin@example.com
Password: Admin@123
```

---

## 🎯 Expected Pages After Login

Once logged in, you should access:

- Dashboard
- Attendance
- Employee
- Leave Management
- Payroll
- Reports
- Settings

If redirect loops back to login → Check ProtectedRoute console logs

---

**Now test and monitor the console - let me know what messages you see!**
