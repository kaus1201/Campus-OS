const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    body('semester')
        .notEmpty().withMessage('Semester is required')
        .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
    body('department')
        .trim()
        .notEmpty().withMessage('Department is required'),
    validate
];

/**
 * Validation rules for user login
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

/**
 * Validation rules for creating posts
 */
const postValidation = [
    body('content')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isLength({ max: 5000 }).withMessage('Content too long (max 5000 characters)'),
    body('type')
        .notEmpty().withMessage('Post type is required')
        .isIn(['request', 'resource', 'poll', 'text']).withMessage('Invalid post type'),
    body('section')
        .optional()
        .isIn(['classroom', 'campus', 'notice']).withMessage('Invalid section'),
    body('tag')
        .optional()
        .isIn(['general', 'note', 'pyq', 'syllabus', 'template']).withMessage('Invalid tag'),
    validate
];

/**
 * Validation rules for deadlines
 */
const deadlineValidation = [
    body('subjectId')
        .notEmpty().withMessage('Subject ID is required')
        .isMongoId().withMessage('Invalid subject ID'),
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title too long'),
    body('dueDate')
        .notEmpty().withMessage('Due date is required')
        .isISO8601().withMessage('Invalid date format'),
    validate
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const mongoIdValidation = [
    param('id').isMongoId().withMessage('Invalid ID format'),
    validate
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    postValidation,
    deadlineValidation,
    mongoIdValidation
};
