import api from './axiosConfig';
import { Message, ChatConversation } from '../types';

export const getConversations = async (): Promise<ChatConversation[]> => {
  const response = await api.get('/messages/conversations');
  return response.data;
};

export const getMessagesBetweenUsers = async (userId: string): Promise<Message[]> => {
  const response = await api.get(`/messages/${userId}`);
  return response.data;
};

export const markMessagesAsRead = async (userId: string): Promise<void> => {
  await api.put(`/messages/read/${userId}`);
};

export const sendMessageREST = async (receiverId: string, content: string): Promise<Message> => {
  const response = await api.post('/messages', { receiverId, content });
  return response.data;
};
