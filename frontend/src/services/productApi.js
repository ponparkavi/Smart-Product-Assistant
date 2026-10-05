import api from './api';

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const getProducts = async (category = null, warrantyStatus = null, search = null) => {
  const params = {};
  if (category) params.category = category;
  if (warrantyStatus) params.warranty_status = warrantyStatus;
  if (search) params.search = search;
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const uploadProductImage = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/products/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getProductSummary = async () => {
  const response = await api.get('/products/summary');
  return response.data;
};

export const extractInvoiceOCR = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/ocr/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
