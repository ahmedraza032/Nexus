import api from './axiosConfig';
import { Connection, ConnectionStatusResponse } from '../types';

// Send a connection request to another user
export const sendConnectionRequest = async (
  recipientId: string,
  message?: string
): Promise<Connection> => {
  const { data } = await api.post<Connection>('/connections', { recipientId, message });
  return data;
};

// Accept or reject a pending request
export const respondToRequest = async (
  connectionId: string,
  action: 'accepted' | 'rejected'
): Promise<Connection> => {
  const { data } = await api.put<Connection>(`/connections/${connectionId}`, { action });
  return data;
};

// Remove an accepted connection
export const disconnect = async (connectionId: string): Promise<void> => {
  await api.delete(`/connections/${connectionId}`);
};

// Get all connections for the current user (optionally filtered by status)
export const getMyConnections = async (
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<Connection[]> => {
  const { data } = await api.get<Connection[]>('/connections', {
    params: status ? { status } : {},
  });
  return data;
};

// Get connection status between the current user and a specific user
export const getConnectionStatus = async (
  userId: string
): Promise<ConnectionStatusResponse> => {
  const { data } = await api.get<ConnectionStatusResponse>(`/connections/status/${userId}`);
  return data;
};
