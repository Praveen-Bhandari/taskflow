import Project from '../models/Project.js';
import Task from '../models/Task.js';

// Project ke saath task count aur completion % jodne ka helper
const withStats = (project, stat) => {
  const total = stat?.total || 0;
  const done = stat?.done || 0;
  return {
    ...project,
    taskCount: total,
    completedCount: done,
    completionPercentage: total ? Math.round((done / total) * 100) : 0,
  };
};

// GET /api/projects
export const getProjects = async (req, res) => {
  const projects = await Project.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  // Ek hi query me saare projects ke task counts
  const stats = await Task.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      },
    },
  ]);

  const statMap = new Map(stats.map((s) => [String(s._id), s]));
  const data = projects.map((p) => withStats(p, statMap.get(String(p._id))));

  res.status(200).json({
    success: true,
    message: 'Projects fetched',
    data: { projects: data },
  });
};

// GET /api/projects/:id
export const getProject = async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    user: req.user._id, // ownership check
  }).lean();

  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: 'Project not found' });
  }

  const [stat] = await Task.aggregate([
    { $match: { user: req.user._id, project: project._id } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: 'Project fetched',
    data: { project: withStats(project, stat) },
  });
};

// POST /api/projects
export const createProject = async (req, res) => {
  const { name, description, color } = req.body;

  const project = await Project.create({
    user: req.user._id,    name,
    description,
    color,
  });

  res.status(201).json({
    success: true,
    message: 'Project created',
    data: { project: withStats(project.toObject(), null) },
  });
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
  const updates = {};
  ['name', 'description', 'color'].forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).lean();

  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: 'Project not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Project updated',
    data: { project },
  });
};

// DELETE /api/projects/:id (cascade: tasks bhi delete)
export const deleteProject = async (req, res) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: 'Project not found' });
  }

  const result = await Task.deleteMany({
    project: project._id,
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: `Project deleted along with ${result.deletedCount} task(s)`,
    data: {},
  });
};