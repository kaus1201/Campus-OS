const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/user/timetable
 * @desc    Get user's timetable
 * @access  Private
 */
router.get('/timetable', auth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.json({
        success: true,
        data: user.timetable || {}
    });
}));

/**
 * @route   POST /api/user/timetable
 * @desc    Save user's timetable
 * @access  Private
 */
router.post('/timetable', auth, asyncHandler(async (req, res) => {
    const { timetable } = req.body;

    const user = await User.findById(req.user.id);
    user.timetable = timetable;
    await user.save();

    res.json({
        success: true,
        data: user.timetable
    });
}));

/**
 * @route   GET /api/user/attendance
 * @desc    Get user's attendance records
 * @access  Private
 */
router.get('/attendance', auth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.json({
        success: true,
        data: user.attendance
    });
}));

/**
 * @route   PUT /api/user/attendance
 * @desc    Update attendance for a subject
 * @access  Private
 */
router.put('/attendance', auth, asyncHandler(async (req, res) => {
    const { subjectId, type } = req.body;

    if (!['present', 'absent'].includes(type)) {
        return res.status(400).json({
            success: false,
            error: 'Type must be "present" or "absent"'
        });
    }

    const user = await User.findById(req.user.id);
    let record = user.attendance.find(r => r.subjectId.toString() === subjectId);

    if (!record) {
        user.attendance.push({ subjectId, attended: 0, total: 0 });
        record = user.attendance[user.attendance.length - 1];
    }

    if (type === 'present') {
        record.attended++;
        record.total++;
    } else if (type === 'absent') {
        record.total++;
    }

    await user.save();

    res.json({
        success: true,
        data: record
    });
}));

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');

    res.json({
        success: true,
        data: user
    });
}));

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, asyncHandler(async (req, res) => {
    const { name, semester, department } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (semester) user.semester = semester;
    if (department) user.department = department;

    await user.save();

    res.json({
        success: true,
        data: user
    });
}));

module.exports = router;
