import api from './api';

export const uploadDocument = async (title, documentType, productId, file) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('document_type', documentType);
  if (productId) {
    formData.append('product_id', productId);
  }
  formData.append('file', file);
  
  const response = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDocuments = async (productId = null) => {
  const params = {};
  if (productId) {
    params.product_id = productId;
  }
  const response = await api.get('/documents', { params });
  return response.data;
};

export const deleteDocument = async (docId) => {
  const response = await api.delete(`/documents/${docId}`);
  return response.data;
};
