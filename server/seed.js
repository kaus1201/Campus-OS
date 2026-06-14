require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('./models/Subject');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Connected for Seeding"));

const subjects = [
    // Sem 2 (Example)
    { title: "Engineering Math II", code: "MAT102", semester: 2, credits: 4 },
    { title: "Engineering Physics", code: "PHY102", semester: 2, credits: 4 },
    { title: "Basic Electronics", code: "ELN102", semester: 2, credits: 3 },
    { title: "C Programming", code: "CPS102", semester: 2, credits: 3 },
    { title: "Communication Skills", code: "ENG102", semester: 2, credits: 1 },

    // Sem 3
    { title: "Data Structures", code: "CS301", semester: 3, credits: 4 },
    { title: "Digital Logic", code: "CS302", semester: 3, credits: 3 },
    { title: "Discrete Math", code: "MAT301", semester: 3, credits: 3 },
    { title: "Object Oriented Java", code: "CS303", semester: 3, credits: 4 },
];

const seedDB = async () => {
    await Subject.deleteMany({});
    await Subject.insertMany(subjects);
    console.log("✅ Database Seeded with Subjects!");
    process.exit();
};

seedDB();
