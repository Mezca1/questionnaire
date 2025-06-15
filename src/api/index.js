import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', config); // 添加请求日志
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response); // 添加响应日志
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response || error); // 添加错误日志
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data)
};

export const questionnaires = {
  create: (data) => api.post('/questionnaires', data),
  list: () => api.get('/questionnaires'),
  get: (id) => api.get(`/questionnaires/${id}`),
  submit: (id, data) => api.post(`/questionnaires/${id}/submit`, data),
  getAnswers: (id) => api.get(`/questionnaires/${id}/answers`),
  getMyAnswers: () => api.get('/user/questionnaires')
};

export default api; 