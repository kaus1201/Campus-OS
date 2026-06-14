const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    semester: { type: Number, required: true, index: true },
    credits: { type: Number, default: 3 }
}, { timestamps: true });

// Add indexes for performance
SubjectSchema.index({ semester: 1, code: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
