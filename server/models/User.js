const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    semester: { type: Number, required: true, min: 1, max: 8 },
    department: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    attendance: [{
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        attended: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }],
    timetable: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ semester: 1, department: 1 });

module.exports = mongoose.model('User', UserSchema);
