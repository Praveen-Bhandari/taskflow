import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../services/taskService';
import { fetchProjects } from '../services/projectService';
import { getErrorMessage } from '../utils/getErrorMessage';
import useDebounce from '../hooks/useDebounce';

const STATUSES = [
  ['todo', 'To do'],
  ['in-progress', 'In progress'],
  ['done', 'Done'],
];
const PRIORITIES = ['low', 'medium', 'high'];

const EMPTY_FILTERS = {
  search: '',
  status: '',
  priority: '',
  projectId: '',
  dueFrom: '',
  dueTo: '',
  sort: 'createdAt',
  order: '',
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'No due date';

const isOverdue = (t) => {
  if (!t.dueDate || t.status === 'done') return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(t.dueDate) < today;
};

function TaskForm({ initial, projects, onSubmit, onCancel, submitLabel, isCreate }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the task'));
      setSaving(false);
    }
  };

  const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  return (
    <form className="panel form" onSubmit={submit}>
      <div className="field">
        <label>Title</label>
        <input name="title" value={form.title} onChange={onChange} maxLength={120} required />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          maxLength={1000}
          rows={2}
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Project</label>
          <select name="project" value={form.project} onChange={onChange} required>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select name="status" value={form.status} onChange={onChange}>
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Priority</label>
          <select name="priority" value={form.priority} onChange={onChange}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Due date</label>
          <input
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={onChange}
            min={isCreate ? todayLocal : undefined}
          />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button className="btn btn-outline" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const query = useDebounce(filters, 300);
  const reqId = useRef(0);


  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== '')
      );
      const data = await fetchTasks(params);
      if (id === reqId.current) setTasks(data); // ignore the response of an outdated request
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err, ' Could not load tasks'));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => setActionError(getErrorMessage(err, 'Could not load projects')));
  }, []);

  const setFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasFilters = ['search', 'status', 'priority', 'projectId', 'dueFrom', 'dueTo'].some(
    (k) => filters[k] !== ''
  );

  const handleCreate = async (form) => {
    const payload = { ...form };
    if (!payload.dueDate) delete payload.dueDate;
    await createTask(payload);
    setShowCreate(false);
    await load();
  };

  const handleUpdate = async (id, form) => {
    await updateTask(id, form); // an empty dueDate makes the server store null
    setEditingId(null);
    await load();
  };

  const changeStatus = async (t, status) => {
    setBusyId(t._id);
    setActionError('');
    try {
      await updateTaskStatus(t._id, status);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not update the status'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    setBusyId(t._id);
    setActionError('');
    try {
      await deleteTask(t._id);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete the task'));
    } finally {
      setBusyId(null);
    }
  };

  const newTaskInitial = {
    title: '',
    description: '',
    project: filters.projectId || projects[0]?._id || '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  };

  const noProjects = projects.length === 0;

  return (
    <div>
      <div className="page-head">
        <h2>Tasks</h2>
        {!showCreate && (
          <button className="btn" disabled={noProjects} onClick={() => setShowCreate(true)}>
            + New task
          </button>
        )}
      </div>

      {noProjects && (
        <p className="muted" style={{ marginBottom: 12 }}>
          Create a project on the Projects page before adding tasks.
        </p>
      )}

      {showCreate && (
        <TaskForm
          isCreate
          initial={newTaskInitial}
          projects={projects}
          submitLabel="Create task"
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Filters, search, sort: sab ek saath combined */}
      <div className="panel filters">
        <input
          name="search"
          placeholder="Search by title..."
          value={filters.search}
          onChange={setFilter}
        />
        <select name="status" value={filters.status} onChange={setFilter}>
          <option value="">All status</option>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="priority" value={filters.priority} onChange={setFilter}>
          <option value="">All priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select name="projectId" value={filters.projectId} onChange={setFilter}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <label className="filter-label">
          Due from
          <input name="dueFrom" type="date" value={filters.dueFrom} onChange={setFilter} />
        </label>
        <label className="filter-label">
          Due to
          <input name="dueTo" type="date" value={filters.dueTo} onChange={setFilter} />
        </label>
        <select name="sort" value={filters.sort} onChange={setFilter}>
          <option value="createdAt">Sort: Created date</option>
          <option value="dueDate">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <select name="order" value={filters.order} onChange={setFilter}>
          <option value="">Default order</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        {hasFilters && (
          <button className="btn btn-outline" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {actionError && <p className="error">{actionError}</p>}

      {loading && tasks.length === 0 && <p className="muted">Loading tasks...</p>}

      {!loading && error && (
        <div className="panel">
          <p className="error">{error}</p>
          <button className="btn" onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="panel empty">
          <p>
            {hasFilters
              ? 'No tasks match these filters.'
              : 'No tasks yet.'}
          </p>
          {hasFilters ? (
            <button className="btn btn-outline" onClick={clearFilters}>Clear filters</button>
          ) : (
            !noProjects && (
              <button className="btn" onClick={() => setShowCreate(true)}>
                Create your first task
              </button>
            )
          )}
        </div>
      )}

      {!error && tasks.length > 0 && (
        <ul className={`task-items ${loading ? 'dim' : ''}`}>
          {tasks.map((t) =>
            editingId === t._id ? (
              <li key={t._id}>
                <TaskForm
                  initial={{
                    title: t.title,
                    description: t.description || '',
                    project: t.project?._id || '',
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
                  }}
                  projects={projects}
                  submitLabel="Save changes"
                  onSubmit={(form) => handleUpdate(t._id, form)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={t._id} className="panel task-item">
                <input
                  type="checkbox"
                  className="task-check"
                  checked={t.status === 'done'}
                  disabled={busyId === t._id}
                  onChange={() => changeStatus(t, t.status === 'done' ? 'todo' : 'done')}
                  title="Mark complete"
                />
                <div className="task-main">
                  <div className={`task-title ${t.status === 'done' ? 'is-done' : ''}`}>
                    {t.title}
                  </div>
                  {t.description && <div className="muted small">{t.description}</div>}
                  <div className="task-meta">
                    <span className="dot" style={{ background: t.project?.color || '#999' }} />
                    {t.project?.name || 'No project'} · {formatDate(t.dueDate)}
                    {isOverdue(t) && <span className="tag-overdue">Overdue</span>}
                  </div>
                </div>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                <select
                  className="status-select"
                  value={t.status}
                  disabled={busyId === t._id}
                  onChange={(e) => changeStatus(t, e.target.value)}
                >
                  {STATUSES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => setEditingId(t._id)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busyId === t._id}
                  onClick={() => handleDelete(t)}
                >
                  Delete
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}