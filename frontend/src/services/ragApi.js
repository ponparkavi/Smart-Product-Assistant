import api from './api';

export const indexDocument = async (docId) => {
  const response = await api.post(`/rag/${docId}/index`);
  return response.data;
};

export const chatWithDocument = async (docId, question) => {
  const response = await api.post(`/rag/${docId}/chat`, { question });
  return response.data;
};

export const chatWithProduct = async (productId, question) => {
  const response = await api.post(`/rag/product/${productId}/chat`, { question });
  return response.data;
};
