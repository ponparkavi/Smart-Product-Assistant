import api from './api';

export const getMaintenancePrediction = async (productId) => {
  const response = await api.get(`/maintenance/${productId}`);
  return response.data;
};
