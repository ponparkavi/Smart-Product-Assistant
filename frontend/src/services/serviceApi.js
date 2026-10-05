import api from './api';

export const getServiceCenters = async (brand, location) => {
  const params = new URLSearchParams();
  if (brand) params.append('brand', brand);
  if (location) params.append('location', location);
  
  const response = await api.get(`/services/centers?${params.toString()}`);
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/services/bookings', bookingData);
  return response.data;
};

export const getBookings = async (productId = null) => {
  const url = productId ? `/services/bookings?product_id=${productId}` : '/services/bookings';
  const response = await api.get(url);
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/services/bookings/${bookingId}`);
  return response.data;
};
