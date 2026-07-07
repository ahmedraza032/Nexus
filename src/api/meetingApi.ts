import api from './axiosConfig';
import {
  Meeting,
  ScheduleMeetingPayload,
  UpdateMeetingPayload,
  MeetingStatus,
} from '../types';

export interface GetMeetingsFilters {
  status?: MeetingStatus;
  from?: string; // ISO date string
  to?: string;   // ISO date string
}

// Schedule a new meeting
export const scheduleMeeting = async (payload: ScheduleMeetingPayload): Promise<Meeting> => {
  const { data } = await api.post<Meeting>('/meetings', payload);
  return data;
};

// Get all meetings for the authenticated user (with optional filters)
export const getMeetings = async (filters?: GetMeetingsFilters): Promise<Meeting[]> => {
  const { data } = await api.get<Meeting[]>('/meetings', { params: filters });
  return data;
};

// Get a single meeting by ID
export const getMeetingById = async (id: string): Promise<Meeting> => {
  const { data } = await api.get<Meeting>(`/meetings/${id}`);
  return data;
};

// Accept a pending meeting (attendee only)
export const acceptMeeting = async (id: string): Promise<Meeting> => {
  const { data } = await api.put<Meeting>(`/meetings/${id}/accept`);
  return data;
};

// Reject a pending meeting (attendee only)
export const rejectMeeting = async (id: string): Promise<Meeting> => {
  const { data } = await api.put<Meeting>(`/meetings/${id}/reject`);
  return data;
};

// Cancel a meeting (organizer only)
export const cancelMeeting = async (id: string): Promise<Meeting> => {
  const { data } = await api.put<Meeting>(`/meetings/${id}/cancel`);
  return data;
};

// Update meeting details (organizer only, pending meetings only)
export const updateMeeting = async (id: string, payload: UpdateMeetingPayload): Promise<Meeting> => {
  const { data } = await api.put<Meeting>(`/meetings/${id}`, payload);
  return data;
};

// Delete a cancelled/rejected meeting
export const deleteMeeting = async (id: string): Promise<void> => {
  await api.delete(`/meetings/${id}`);
};
