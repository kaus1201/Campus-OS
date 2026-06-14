# 🚀 Quick Start Guide

Get Campus OS up and running in 5 minutes!

## Prerequisites Check
- [ ] Node.js installed (`node --version`)
- [ ] MongoDB installed and running (`mongod --version`)
- [ ] Git installed (optional)

## Step 1: Install Dependencies

### Server
```bash
cd server
npm install
```

### Client
```bash
cd ../client
npm install
```

## Step 2: Start MongoDB

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or run manually
mongod
```

## Step 3: Setup Database

```bash
cd server

# Seed the database with sample subjects
npm run seed

# Create a default user
npm run check-users
```

**Default Login Credentials:**
- Email: `student@campus.os`
- Password: `Password123!`

## Step 4: Start the Application

Open **two terminal windows**:

### Terminal 1 - Backend
```bash
cd server
npm run dev
```
✅ Server should start on http://localhost:5001

### Terminal 2 - Frontend
```bash
cd client
npm start
```
✅ Browser should open at http://localhost:3000

## Step 5: Login & Explore! 🎉

1. Go to http://localhost:3000
2. Login with the default credentials
3. Explore the features:
   - **Academic Mode**: Subject posts, chat, attendance, timetable
   - **Campus Mode**: Global feed, notices, polls

---

## 🔧 Troubleshooting

### "MongoDB connection failed"
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
brew services start mongodb-community
```

### "Port 5001 already in use"
```bash
# Find and kill the process
lsof -ti:5001 | xargs kill -9

# Or change the port in server/.env
PORT=5002
```

### "Module not found"
```bash
# Reinstall dependencies
cd server && npm install
cd ../client && npm install
```

### "No users found" after seeding
```bash
# Run the user creation script
cd server
npm run check-users
```

---

## 📝 Common Tasks

### Reset Everything
```bash
cd server
npm run reset  # Deletes all data
npm run seed   # Re-seed subjects
npm run check-users  # Create default user
```

### Add More Subjects
Edit `server/seed.js` and add subjects, then:
```bash
npm run seed
```

### Create Additional Users
Use the registration form in the app or modify `server/utils/checkUsers.js`

---

## 🎯 What's Next?

- Change the default password
- Add your own subjects
- Customize the timetable
- Upload some notes
- Create polls and posts
- Invite your classmates!

---

## 📚 Full Documentation

For detailed information, see:
- `README.md` - Complete documentation
- `CHANGELOG.md` - All improvements made
- API endpoints documentation in README.md

---

**Need Help?** Check the troubleshooting section in README.md
