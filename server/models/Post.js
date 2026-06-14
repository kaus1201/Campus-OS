const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: false },
    section: { type: String, enum: ['classroom', 'campus', 'notice'], default: 'classroom', index: true },
    type: { type: String, enum: ['request', 'resource', 'poll', 'text'], required: true },
    tag: { type: String, enum: ['general', 'note', 'pyq', 'syllabus', 'template'], default: 'general' },
    content: { type: String, required: true },
    fileUrl: String,
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pollOptions: [{
        text: String,
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add indexes for performance
PostSchema.index({ subjectId: 1, createdAt: -1 });
PostSchema.index({ section: 1, createdAt: -1 });
PostSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Post', PostSchema);
