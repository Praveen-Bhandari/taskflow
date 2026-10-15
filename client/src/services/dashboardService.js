import api from './api';

export const fetchDashboard = async () => {
  const res = await api.get('/dashboard');
  return res.data.data;
};