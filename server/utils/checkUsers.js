require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Utility script to check existing users and create a default user if none exist
 */
const checkAndCreateUser = async () => {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ Connected to database");

        const users = await User.find({});

        if (users.length > 0) {
            console.log("\n📋 Existing Users:");
            users.forEach(u => {
                console.log(`  - Name: ${u.name}`);
                console.log(`    Email: ${u.email}`);
                console.log(`    Semester: ${u.semester}`);
                console.log(`    Department: ${u.department}`);
                console.log(`    Role: ${u.role}`);
                console.log(`    Active: ${u.isActive}`);
                console.log('');
            });
            console.log("💡 Note: Passwords are hashed and cannot be retrieved.");
            console.log("   If you forgot a password, you can reset the database with 'npm run reset'");
        } else {
            console.log("\n⚠️  No users found. Creating a default user...");
            const hashedPassword = await bcrypt.hash('Password123!', 10);

            await User.create({
                name: "Demo Student",
                email: "student@campus.os",
                password: hashedPassword,
                semester: 3,
                department: "CS",
                role: "student"
            });

            console.log("\n✅ Default user created successfully!");
            console.log("📧 Email: student@campus.os");
            console.log("🔑 Password: Password123!");
            console.log("\n⚠️  Please change this password after first login!");
        }
    } catch (error) {
        console.error("\n❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n👋 Disconnected from database");
        process.exit();
    }
};

checkAndCreateUser();
