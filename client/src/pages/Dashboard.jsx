import { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/dashboardService';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
    : 'No date';

function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function TaskList({ title, tasks, emptyText }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {tasks.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t._id} className="task-row">
              <div>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  <span
                    className="dot"
                    style={{ background: t.project?.color || '#999' }}
                  />
                  {t.project?.name || 'No project'} · {formatDate(t.dueDate)}
                </div>
              </div>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchDashboard());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Dashboard load nahi hua. Server chal raha hai ya nahi check karo.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="muted">Loading dashboard...</p>;

  if (error) {
    return (
      <div className="panel">
        <p className="error">{error}</p>
        <button className="btn" onClick={load}>Retry</button>
      </div>
    );
  }

  const { stats, todayTasks, weekTasks, projectProgress } = data;

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} tone="green" />
        <StatCard label="Pending" value={stats.pending} tone="blue" />
        <StatCard label="Overdue" value={stats.overdue} tone="red" />
        <StatCard label="Due today" value={stats.dueToday} />
        <StatCard label="Due this week" value={stats.dueThisWeek} />
      </div>

      <section className="panel">
        <h3>Project progress</h3>
        {projectProgress.length === 0 ? (
          <p className="muted">Abhi koi project nahi hai. Pehle ek project banao.</p>
        ) : (
          projectProgress.map((p) => (
            <div key={p._id} className="progress-item">
              <div className="progress-head">
                <span>
                  <span className="dot" style={{ background: p.color }} />
                  {p.name}
                </span>
                <span className="muted">
                  {p.completedCount}/{p.taskCount} · {p.completionPercentage}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${p.completionPercentage}%`, background: p.color }}
                />
              </div>
            </div>
          ))
        )}
      </section>

      <div className="two-col">
        <TaskList
          title="Due today"
          tasks={todayTasks}
          emptyText="Aaj koi task due nahi hai."
        />
        <TaskList
          title="Due this week"
          tasks={weekTasks}
          emptyText="Is hafte koi task due nahi hai."
        />
      </div>
    </div>
  );
}