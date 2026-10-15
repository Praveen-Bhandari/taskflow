import api from './api';

export const fetchTasks = async (params = {}) => {
  const res = await api.get('/tasks', { params });
  return res.data.data.tasks;
};

export const createTask = async (payload) => {
  const res = await api.post('/tasks', payload);
  return res.data.data.task;
};

export const updateTask = async (id, payload) => {
  const res = await api.put(`/tasks/${id}`, payload);
  return res.data.data.task;
};

export const updateTaskStatus = async (id, status) => {
  const res = await api.patch(`/tasks/${id}/status`, { status });
  return res.data.data.task;
};

export const deleteTask = async (id) => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data.message;
};