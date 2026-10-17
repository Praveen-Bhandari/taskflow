import Task from '../models/Task.js';
import Project from '../models/Project.js';

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

// Escape special characters so the search text cannot break the regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ownsProject = (projectId, userId) =>
  Project.exists({ _id: projectId, user: userId });

const notFound = (res, what = 'Task') =>
  res.status(404).json({ success: false, message: `${what} not found` });

// GET /api/tasks?status=&priority=&projectId=&search=&dueFrom=&dueTo=&sort=&order=
export const getTasks = async (req, res) => {
  const {
    status,
    priority,
    projectId,
    search,
    dueFrom,
    dueTo,
    sort = 'createdAt',
    order,
  } = req.query;

  // All filters live in one object, so they work combined
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (projectId) filter.project = projectId;
  if (search && search.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }
  if (dueFrom || dueTo) {
    filter.dueDate = {};
    if (dueFrom) filter.dueDate.$gte = new Date(dueFrom);
    if (dueTo) {
      const end = new Date(dueTo);
      end.setUTCHours(23, 59, 59, 999);
      filter.dueDate.$lte = end;
    }
  }

  const tasks = await Task.find(filter)
    .populate('project', 'name color')
    .lean();

  // Default direction: dueDate asc, priority high-first, createdAt newest-first
  const defaultDir = sort === 'dueDate' ? 1 : -1;
  const dir = order ? (order === 'asc' ? 1 : -1) : defaultDir;

  const getVal = (t) => {
    if (sort === 'priority') return PRIORITY_RANK[t.priority];
    if (sort === 'dueDate') return t.dueDate ? new Date(t.dueDate).getTime() : null;
    return new Date(t.createdAt).getTime();
  };

  tasks.sort((a, b) => {
    const x = getVal(a);
    const y = getVal(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1; //  tasks without a due date always go last
    if (y === null) return -1;
    return (x - y) * dir;
  });

  res.status(200).json({
    success: true,
    message: 'Tasks fetched',
    data: { count: tasks.length, tasks },
  });
};

// POST /api/tasks
export const createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, project } = req.body;

  if (!(await ownsProject(project, req.user._id))) {
    return notFound(res, 'Project');
  }

  const task = await Task.create({
    user: req.user._id, // the owner comes from the token, never from the body
    project,
    title,
    description,
    status,
    priority,
    dueDate: dueDate || null,
  });

  res.status(201).json({
    success: true,
    message: 'Task created',
    data: { task },
  });
};

// PUT /api/tasks/:id  ((changing the project moves the task))
export const updateTask = async (req, res) => {
  const updates = {};
  ['title', 'description', 'status', 'priority', 'dueDate', 'project'].forEach(
    (f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
  );
  if (updates.dueDate === '') updates.dueDate = null;

  if (updates.project && !(await ownsProject(updates.project, req.user._id))) {
    return notFound(res, 'Project');
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  )
    .populate('project', 'name color')
    .lean();

  if (!task) return notFound(res);

  res.status(200).json({
    success: true,
    message: 'Task updated',
    data: { task },
  });
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: req.body.status },
    { new: true, runValidators: true }
  )
    .populate('project', 'name color')
    .lean();

  if (!task) return notFound(res);

  res.status(200).json({
    success: true,
    message: 'Status updated',
    data: { task },
  });
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) return notFound(res);

  res.status(200).json({
    success: true,
    message: 'Task deleted',
    data: {},
  });
};