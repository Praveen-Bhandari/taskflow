import api from './api';

export const fetchProjects = async () => {
  const res = await api.get('/projects');
  return res.data.data.projects;
};

export const createProject = async (payload) => {
  const res = await api.post('/projects', payload);
  return res.data.data.project;
};

export const updateProject = async (id, payload) => {
  const res = await api.put(`/projects/${id}`, payload);
  return res.data.data.project;
};

export const deleteProject = async (id) => {
  const res = await api.delete(`/projects/${id}`);
  return res.data.message;
};