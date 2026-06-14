const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
const { postValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: images, PDFs, Word documents'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
    }
});

/**
 * @route   GET /api/posts
 * @desc    Get posts (filtered by subjectId or section)
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
    const { subjectId, section, page = 1, limit = 20 } = req.query;

    let query = { isDeleted: false };

    if (subjectId) query.subjectId = subjectId;
    if (section) query.section = section;

    const posts = await Post.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
        success: true,
        data: posts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
}));

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post('/', auth, upload.single('file'), asyncHandler(async (req, res) => {
    const { subjectId, content, type, tag, pollOptions, section } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Content is required'
        });
    }

    let parsedOptions = [];
    if (type === 'poll' && pollOptions) {
        try {
            parsedOptions = JSON.parse(pollOptions).map(opt => ({
                text: opt,
                voters: []
            }));
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'Invalid poll options format'
            });
        }
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await Post.create({
        userId: req.user.id,
        subjectId,
        section,
        content,
        type,
        tag,
        fileUrl,
        pollOptions: parsedOptions
    });

    const populatedPost = await Post.findById(post._id).populate('userId', 'name email');

    res.status(201).json({
        success: true,
        data: populatedPost
    });
}));

/**
 * @route   PUT /api/posts/:id/vote
 * @desc    Toggle vote on a post
 * @access  Private
 */
router.put('/:id/vote', auth, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }

    const userIndex = post.votes.indexOf(req.user.id);

    if (userIndex > -1) {
        post.votes.splice(userIndex, 1);
    } else {
        post.votes.push(req.user.id);
    }

    await post.save();

    res.json({
        success: true,
        data: { votes: post.votes }
    });
}));

/**
 * @route   PUT /api/posts/:id/poll
 * @desc    Vote on a poll
 * @access  Private
 */
router.put('/:id/poll', auth, asyncHandler(async (req, res) => {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }

    if (post.type !== 'poll') {
        return res.status(400).json({
            success: false,
            error: 'This post is not a poll'
        });
    }

    if (optionIndex < 0 || optionIndex >= post.pollOptions.length) {
        return res.status(400).json({
            success: false,
            error: 'Invalid option index'
        });
    }

    // Remove user's vote from all options
    post.pollOptions.forEach(opt => {
        const idx = opt.voters.indexOf(req.user.id);
        if (idx > -1) opt.voters.splice(idx, 1);
    });

    // Add vote to selected option
    post.pollOptions[optionIndex].voters.push(req.user.id);

    await post.save();

    res.json({
        success: true,
        data: { pollOptions: post.pollOptions }
    });
}));

/**
 * @route   DELETE /api/posts/:id
 * @desc    Soft delete a post
 * @access  Private
 */
router.delete('/:id', auth, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }

    // Only post owner or admin can delete
    if (post.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Not authorized to delete this post'
        });
    }

    post.isDeleted = true;
    await post.save();

    res.json({
        success: true,
        message: 'Post deleted successfully'
    });
}));

module.exports = router;
