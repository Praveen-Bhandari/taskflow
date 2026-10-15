import { useEffect, useState } from 'react';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../services/projectService';
import { getErrorMessage } from '../utils/getErrorMessage';

const EMPTY = { name: '', description: '', color: '#3b82f6' };

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function ProjectForm({ initial, onSubmit, onCancel, submitLabel }) {
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
      setError(getErrorMessage(err, 'Project save nahi hua'));
      setSaving(false);
    }
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <div className="field">
        <label>Name</label>
        <input name="name" value={form.name} onChange={onChange} maxLength={60} required />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          maxLength={300}
          rows={2}
        />
      </div>
      <div className="field">
        <label>Color</label>
        <input name="color" type="color" value={form.color} onChange={onChange} />
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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setProjects(await fetchProjects());
    } catch (err) {
      setError(getErrorMessage(err, 'Projects load nahi hue'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (form) => {
    await createProject(form);
    setShowCreate(false);
    await load();
  };

  const handleUpdate = async (id, form) => {
    await updateProject(id, form);
    setEditingId(null);
    await load();
  };

  const handleDelete = async (p) => {
    const ok = window.confirm(
      `"${p.name}" delete karna hai? Iske ${p.taskCount} task(s) bhi delete ho jayenge.`
    );
    if (!ok) return;
    setBusyId(p._id);
    try {
      await deleteProject(p._id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Delete nahi hua'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h2>Projects</h2>
        {!showCreate && (
          <button className="btn" onClick={() => setShowCreate(true)}>
            + New project
          </button>
        )}
      </div>

      {showCreate && (
        <ProjectForm
          initial={EMPTY}
          submitLabel="Create project"
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading && <p className="muted">Loading projects...</p>}

      {!loading && error && (
        <div className="panel">
          <p className="error">{error}</p>
          <button className="btn" onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && !showCreate && (
        <div className="panel empty">
          <p>Abhi koi project nahi hai.</p>
          <button className="btn" onClick={() => setShowCreate(true)}>
            Pehla project banao
          </button>
        </div>
      )}

      <div className="card-grid">
        {projects.map((p) =>
          editingId === p._id ? (
            <ProjectForm
              key={p._id}
              initial={{
                name: p.name,
                description: p.description || '',
                color: p.color,
              }}
              submitLabel="Save changes"
              onSubmit={(form) => handleUpdate(p._id, form)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={p._id} className="panel project-card">
              <div className="project-top">
                <span className="dot dot-lg" style={{ background: p.color }} />
                <h3>{p.name}</h3>
              </div>
              {p.description && <p className="muted">{p.description}</p>}

              <div className="progress-head">
                <span className="muted">
                  {p.completedCount}/{p.taskCount} tasks
                </span>
                <span className="muted">{p.completionPercentage}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${p.completionPercentage}%`, background: p.color }}
                />
              </div>

              <p className="muted small">Created {formatDate(p.createdAt)}</p>

              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setEditingId(p._id)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  disabled={busyId === p._id}
                  onClick={() => handleDelete(p)}
                >
                  {busyId === p._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}