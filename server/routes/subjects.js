const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/subjects/:semester
 * @desc    Get all subjects for a semester
 * @access  Public
 */
router.get('/:semester', asyncHandler(async (req, res) => {
    const semester = parseInt(req.params.semester);

    if (isNaN(semester) || semester < 1 || semester > 8) {
        return res.status(400).json({
            success: false,
            error: 'Invalid semester (must be 1-8)'
        });
    }

    const subjects = await Subject.find({ semester }).sort({ code: 1 });

    res.json({
        success: true,
        data: subjects
    });
}));

module.exports = router;
