import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const idRule = param('id').isMongoId().withMessage('Invalid task id');

// On create, the due date must be today or later
const notInPast = (value) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (new Date(value) < today) {
    throw new Error('Due date cannot be in the past');
  }
  return true;
};

const listQueryRules = [
  query('status').optional().isIn(STATUSES).withMessage('Invalid status filter'),
  query('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority filter'),
  query('projectId').optional().isMongoId().withMessage('Invalid projectId'),
  query('search').optional().isString().withMessage('Search must be text'),
  query('dueFrom').optional().isISO8601().withMessage('dueFrom must be a valid date'),
  query('dueTo').optional().isISO8601().withMessage('dueTo must be a valid date'),
  query('sort')
    .optional()
    .isIn(['dueDate', 'priority', 'createdAt'])
    .withMessage('sort must be dueDate, priority or createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
];

router
  .route('/')
  .get(listQueryRules, validate, getTasks)
  .post(
    [
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 120 })
        .withMessage('Title cannot exceed 120 characters'),
      body('project').isMongoId().withMessage('Valid project is required'),
      body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
      body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
      body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
      body('dueDate')
        .optional({ values: 'falsy' })
        .isISO8601()
        .withMessage('Due date must be a valid date')
        .bail()
        .custom(notInPast),
    ],
    validate,
    createTask
  );

router
  .route('/:id')
  .put(
    [
      idRule,
      body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty')
        .isLength({ max: 120 })
        .withMessage('Title cannot exceed 120 characters'),
      body('project').optional().isMongoId().withMessage('Invalid project'),
      body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
      body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
      body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
      body('dueDate')
        .optional({ values: 'falsy' })
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    ],
    validate,
    updateTask
  )
  .delete([idRule], validate, deleteTask);

router.patch(
  '/:id/status',
  [idRule, body('status').isIn(STATUSES).withMessage('Invalid status')],
  validate,
  updateTaskStatus
);

export default router;