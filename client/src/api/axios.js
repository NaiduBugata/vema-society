import axios from 'axios';
import { incrementPending, decrementPending } from './loadingBus';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        incrementPending();
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        decrementPending();
        return response;
    },
    (error) => {
        decrementPending();
        return Promise.reject(error);
    }
);

export default api;
