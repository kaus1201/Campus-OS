require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("💥 Deleting all data...");
        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database Wiped. Please register a new user or run 'npm run seed'");
        process.exit();
    })
    .catch(err => {
        console.error("❌ Error:", err.message);
        process.exit(1);
    });
