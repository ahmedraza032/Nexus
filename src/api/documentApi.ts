import axios from './axiosConfig';

export const uploadDocument = async (formData: FormData) => {
  const { data } = await axios.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getDocuments = async () => {
  const { data } = await axios.get('/documents');
  return data;
};

export const getDocumentById = async (id: string) => {
  const { data } = await axios.get(`/documents/${id}`);
  return data;
};

export const downloadDocument = async (id: string) => {
  const response = await axios.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  return response;
};

export const shareDocument = async (id: string, userId: string) => {
  const { data } = await axios.put(`/documents/${id}/share`, { userId });
  return data;
};

export const signDocument = async (id: string, formData: FormData) => {
  const { data } = await axios.put(`/documents/${id}/sign`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateDocumentStatus = async (id: string, status: string) => {
  const { data } = await axios.put(`/documents/${id}/status`, { status });
  return data;
};

export const deleteDocument = async (id: string) => {
  const { data } = await axios.delete(`/documents/${id}`);
  return data;
};
