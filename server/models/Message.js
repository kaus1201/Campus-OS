const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add indexes for performance
MessageSchema.index({ subjectId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
