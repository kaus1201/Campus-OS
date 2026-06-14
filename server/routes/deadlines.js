const express = require('express');
const router = express.Router();
const Deadline = require('../models/Deadline');
const { auth } = require('../middleware/auth');
const { deadlineValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/deadlines/:subjectId
 * @desc    Get all deadlines for a subject
 * @access  Public
 */
router.get('/:subjectId', asyncHandler(async (req, res) => {
    const deadlines = await Deadline.find({
        subjectId: req.params.subjectId,
        isDeleted: false
    }).sort({ dueDate: 1 });

    res.json({
        success: true,
        data: deadlines
    });
}));

/**
 * @route   POST /api/deadlines
 * @desc    Create a new deadline
 * @access  Private
 */
router.post('/', auth, deadlineValidation, asyncHandler(async (req, res) => {
    const deadline = await Deadline.create(req.body);

    res.status(201).json({
        success: true,
        data: deadline
    });
}));

/**
 * @route   DELETE /api/deadlines/:id
 * @desc    Soft delete a deadline
 * @access  Private
 */
router.delete('/:id', auth, asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        return res.status(404).json({
            success: false,
            error: 'Deadline not found'
        });
    }

    deadline.isDeleted = true;
    await deadline.save();

    res.json({
        success: true,
        message: 'Deadline deleted successfully'
    });
}));

module.exports = router;
