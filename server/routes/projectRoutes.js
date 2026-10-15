import express from 'express';
import { body, param } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Is file ke saare routes protected hain
router.use(protect);

const idRule = param('id').isMongoId().withMessage('Invalid project id');

const colorRule = body('color')
  .optional()
  .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .withMessage('Color must be a valid hex code');

const descRule = body('description')
  .optional()
  .isLength({ max: 300 })
  .withMessage('Description cannot exceed 300 characters');

router
  .route('/')
  .get(getProjects)
  .post(
    [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ max: 60 })
        .withMessage('Project name cannot exceed 60 characters'),
      descRule,
      colorRule,
    ],
    validate,
    createProject
  );

router
  .route('/:id')
  .get([idRule], validate, getProject)
  .put(
    [
      idRule,
      body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Project name cannot be empty')
        .isLength({ max: 60 })
        .withMessage('Project name cannot exceed 60 characters'),
      descRule,
      colorRule,
    ],
    validate,
    updateProject
  )
  .delete([idRule], validate, deleteProject);

export default router;