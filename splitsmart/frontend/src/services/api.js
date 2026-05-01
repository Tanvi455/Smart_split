import axios from 'axios';

const API = axios.create({
  baseURL: 'https://splitsmart-v2-1.onrender.com/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');

    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (name, email, password) => API.post('/auth/register', { name, email, password }),
  me: () => API.get('/auth/me'),
  searchUsers: (q) => API.get(`/auth/users?q=${q}`)
};

export const groupsAPI = {
  list: () => API.get('/groups'),
  get: (id) => API.get(`/groups/${id}`),
  create: (data) => API.post('/groups', data),
  update: (id, data) => API.put(`/groups/${id}`, data),
  delete: (id) => API.delete(`/groups/${id}`),
  addMember: (id, userId) => API.post(`/groups/${id}/members`, { userId }),
  getBalances: (id) => API.get(`/groups/${id}/balances`)
};

export const expensesAPI = {
  list: () => API.get('/expenses'),
  get: (id) => API.get(`/expenses/${id}`),
  create: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`),
  settle: (id, userId) => API.post(`/expenses/${id}/settle`, { userId })
};

export const settlementsAPI = {
  list: () => API.get('/settlements'),
  create: (data) => API.post('/settlements', data),
  summary: () => API.get('/settlements/summary')
};

export default API;
