# 🧪 Testing Authentication - Quick Guide

## ✅ Your Current Status

- ✅ Local server running at http://localhost:8000
- ✅ Firebase connection working
- ✅ Authentication UI working
- ⚠️ Need to enable Firebase auth methods OR create test account

---

## 🔍 Error You're Seeing

```
auth/invalid-credential
Invalid email or password
```

This means **one of these**:

1. ❌ Account doesn't exist yet (need to Sign Up first)
2. ❌ Email/Password authentication not enabled in Firebase
3. ❌ Wrong email or password entered

---

## ✅ Solution: Follow These Steps

### **Option A: Create a New Account First** (Recommended)

1. **Click "Sign Up"** (not Log In)
2. Fill in the form:
   ```
   Name: Test User
   Email: test@example.com
   Password: test123
   Confirm: test123
   ```
3. Click **"Create Account"**
4. ✅ If successful: You'll be logged in automatically
5. ❌ If error: See "Enable Firebase Auth" below

---

### **Option B: Enable Firebase Authentication**

If signup also fails, you need to enable authentication:

#### Step 1: Go to Firebase Console
- Open: https://console.firebase.google.com/
- Select: **tamer-educational-activities**

#### Step 2: Enable Email/Password
1. Click **Authentication** (left sidebar)
2. Click **Sign-in method** tab
3. Click **Email/Password** row
4. Toggle **Enable** to ON
5. Click **Save**

#### Step 3: Enable Google (Optional but Recommended)
1. Same page (**Sign-in method**)
2. Click **Google** row
3. Toggle **Enable** to ON
4. Select **Project support email** from dropdown
5. Click **Save**

---

## 🎯 Testing Checklist

### Test Email Signup:
- [ ] Click "Sign Up" button
- [ ] Fill in all fields:
  - [ ] Full Name
  - [ ] Email (use a real format like test@example.com)
  - [ ] Password (at least 6 characters)
  - [ ] Confirm Password (must match)
- [ ] Click "Create Account"
- [ ] ✅ Should see: "Hello, [Your Name]" in header
- [ ] ✅ Modal should close automatically

### Test Email Login:
- [ ] Logout if needed (click Logout button)
- [ ] Click "Log In" button
- [ ] Enter same email and password used for signup
- [ ] Click "Log In"
- [ ] ✅ Should see: "Hello, [Your Name]" in header

### Test Google Sign-In:
- [ ] Click "Sign Up" or "Log In"
- [ ] Click "Continue with Google"
- [ ] Select your Google account
- [ ] ✅ Should see: "Hello, [Google Name]" in header

---

## ⚠️ Common Issues & Fixes

### Issue 1: "auth/operation-not-allowed"
**Cause:** Email/Password auth not enabled in Firebase

**Fix:**
1. Firebase Console → Authentication → Sign-in method
2. Enable Email/Password
3. Save and try again

---

### Issue 2: "auth/invalid-credential"
**Cause:** Account doesn't exist OR wrong password

**Fix:**
- Use **Sign Up** first to create account
- Then use **Log In** with same credentials
- Make sure email/password match exactly

---

### Issue 3: "auth/email-already-in-use"
**Cause:** Account already exists

**Fix:**
- Use **Log In** instead
- OR use **Forgot Password** to reset
- OR use different email

---

### Issue 4: "auth/weak-password"
**Cause:** Password less than 6 characters

**Fix:**
- Use password with at least 6 characters
- Example: `test123` (7 chars) ✅
- Not: `test` (4 chars) ❌

---

### Issue 5: Google Sign-In popup blocked
**Cause:** Browser blocking popups

**Fix:**
1. Look for popup blocker icon in address bar
2. Click it and select "Always allow"
3. Try Google Sign-In again

---

## 🎓 Step-by-Step Test Scenario

### Scenario 1: First Time User

```
1. Open http://localhost:8000
2. Click "Sign Up"
3. Enter:
   Name: John Doe
   Email: john@test.com
   Password: secure123
   Confirm: secure123
4. Click "Create Account"
5. ✅ See: "Hello, John Doe"
6. Modal closes
7. Create some activities
8. Click "Logout"
9. Click "Log In"
10. Enter:
    Email: john@test.com
    Password: secure123
11. Click "Log In"
12. ✅ See: "Hello, John Doe" again
13. Your activities are still there!
```

---

### Scenario 2: Google User

```
1. Open http://localhost:8000
2. Click "Sign Up"
3. Click "Continue with Google"
4. Allow popup if blocked
5. Select Google account
6. ✅ See: "Hello, [Google Name]"
7. Modal closes
8. Create activities
9. Logout
10. Log In with Google again
11. ✅ Everything still there!
```

---

## 🔍 Debugging Tips

### Check Browser Console (F12)
Look for these messages:

✅ **Good signs:**
- `Signed in as [email]`
- `Account created successfully!`
- `Logged in successfully!`

❌ **Bad signs:**
- `auth/operation-not-allowed` → Enable auth in Firebase
- `auth/invalid-credential` → Wrong email/password OR account doesn't exist
- `auth/email-already-in-use` → Use Log In instead
- `auth/weak-password` → Use longer password

---

### Check Firebase Console

1. Go to Authentication → Users tab
2. After signup, you should see your email listed
3. If user appears → Auth is working! ✅
4. If no users → Auth might not be enabled

---

### Check Header

**Not Logged In:**
```
[Sign Up] [Log In]
```

**Logged In:**
```
Hello, John Doe [Logout]
```

---

## 📝 Test Accounts You Can Use

### Email/Password Accounts:
```
Email: test1@example.com
Password: test123

Email: teacher@school.com
Password: teacher123

Email: student@school.com
Password: student123
```

**Note:** Create these by clicking Sign Up first!

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ Sign Up creates account without errors
- ✅ Header shows "Hello, [Name]" after signup
- ✅ Can logout and log back in
- ✅ Activities persist across sessions
- ✅ Google Sign-In works (if enabled)
- ✅ Forgot Password sends email
- ✅ Browser console shows no errors

---

## 🎯 Quick Commands

### Refresh Page:
- Press **F5**

### Open Console:
- Press **F12**

### Clear All and Start Fresh:
- Press **Ctrl+Shift+Delete**
- Clear browsing data
- Restart browser
- Open http://localhost:8000 again

---

## 🆘 Still Not Working?

### 1. Verify Firebase Settings:
- [ ] Project: tamer-educational-activities
- [ ] Email/Password: Enabled
- [ ] Google: Enabled (optional)
- [ ] Support email: Selected (for Google)

### 2. Check Your Inputs:
- [ ] Email format: `something@domain.com`
- [ ] Password: At least 6 characters
- [ ] Passwords match (on signup)
- [ ] Name field filled (on signup)

### 3. Try Different Browser:
- [ ] Chrome (recommended)
- [ ] Firefox
- [ ] Edge
- [ ] Incognito/Private mode

### 4. Restart Server:
- [ ] Press **Ctrl+C** in terminal
- [ ] Run `start-server.bat` again
- [ ] Try again

---

## 📚 More Help

- **Setup Guide:** `AUTH_SETUP_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING_AUTH.md`
- **Features:** `AUTHENTICATION_FEATURES.md`

---

## 🎉 Next Steps After Success

Once authentication works:

1. ✅ Test creating activities
2. ✅ Test saving to Firebase
3. ✅ Test loading saved activities
4. ✅ Test on different devices
5. ✅ Deploy to Vercel
6. ✅ Share with users!

---

**Good luck testing!** 🚀

If you see "Hello, [Your Name]" in the header after signup, **you did it!** 🎊
