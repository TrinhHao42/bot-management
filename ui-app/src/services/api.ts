import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // Changed to match backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchBots = async () => {
  const response = await api.get('/bots');
  return response.data;
};

export const toggleBot = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/bots/${id}/toggle`, { isActive });
  return response.data;
};

export const deleteBot = async (id: string) => {
  const response = await api.delete(`/bots/${id}`);
  return response.data;
};

export const installBot = async (botData: any) => {
  const response = await api.post('/bots/install', botData);
  return response.data;
};

export const sendMessage = async (botId: string, userId: string, message: string) => {
  const response = await api.post(`/chat/${botId}`, { userId, message });
  return response.data;
};

export const getChatHistory = async (botId: string) => {
  const response = await api.get(`/chat/${botId}`);
  return response.data;
};

export const getSchedule = async (botId: string, userId: string = 'user-1') => {
  const response = await api.get(`/automation/${botId}`, { params: { userId } });
  return response.data;
};

export const saveSchedule = async (botId: string, scheduleData: any) => {
  const response = await api.post(`/automation/${botId}`, scheduleData);
  return response.data;
};

export const deleteSchedule = async (botId: string, userId: string = 'user-1') => {
  const response = await api.delete(`/automation/${botId}`, { params: { userId } });
  return response.data;
};

export default api;
