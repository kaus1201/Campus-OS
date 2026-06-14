const mongoose = require('mongoose');

const DeadlineSchema = new mongoose.Schema({
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Add indexes for performance
DeadlineSchema.index({ subjectId: 1, dueDate: 1 });
DeadlineSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Deadline', DeadlineSchema);
