const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/messages/:subjectId
 * @desc    Get all messages for a subject
 * @access  Public
 */
router.get('/:subjectId', asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ subjectId: req.params.subjectId })
        .populate('userId', 'name')
        .sort({ createdAt: 1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
        success: true,
        data: messages
    });
}));

module.exports = router;
