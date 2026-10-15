import Task from '../models/Task.js';
import Project from '../models/Project.js';

const startOfTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

export const getDashboard = async (req, res, next) => {
  try {
    const user = req.user._id;
    const today = startOfTodayUTC();
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 8); // aaj se agle 7 din, poora 7th din included

    const notDone = { status: { $ne: 'done' } };
    const populateProject = { path: 'project', select: 'name color' };

    const [
      total,
      completed,
      pending,
      overdue,
      dueToday,
      dueThisWeek,
      todayTasks,
      weekTasks,
      projects,
      projectStats,
    ] = await Promise.all([
      Task.countDocuments({ user }),
      Task.countDocuments({ user, status: 'done' }),
      Task.countDocuments({ user, ...notDone }),
      Task.countDocuments({ user, ...notDone, dueDate: { $lt: today } }),
      Task.countDocuments({ user, ...notDone, dueDate: { $gte: today, $lt: tomorrow } }),
      Task.countDocuments({ user, ...notDone, dueDate: { $gte: today, $lt: weekEnd } }),
      Task.find({ user, ...notDone, dueDate: { $gte: today, $lt: tomorrow } })
        .populate(populateProject)
        .sort({ priority: 1, createdAt: -1 })
        .limit(10),
      Task.find({ user, ...notDone, dueDate: { $gte: today, $lt: weekEnd } })
        .populate(populateProject)
        .sort({ dueDate: 1 })
        .limit(10),
      Project.find({ user }).sort({ createdAt: -1 }).select('name color').lean(),
      Task.aggregate([
        { $match: { user } },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    // Har project ke liye progress (task na ho to bhi project list me aayega)
    const statMap = new Map(projectStats.map((s) => [String(s._id), s]));
    const projectProgress = projects.map((p) => {
      const s = statMap.get(String(p._id));
      const t = s?.total || 0;
      const d = s?.done || 0;
      return {
        _id: p._id,
        name: p.name,
        color: p.color,
        taskCount: t,
        completedCount: d,
        completionPercentage: t ? Math.round((d / t) * 100) : 0,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Dashboard fetched',
      data: {
        stats: { total, completed, pending, overdue, dueToday, dueThisWeek },
        todayTasks,
        weekTasks,
        projectProgress,
      },
    });
  } catch (err) {
    next(err);
  }
};