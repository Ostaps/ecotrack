import client from './client';

export const getVehicles = async (page = 0, size = 20) => {
  const { data } = await client.get(`/vehicles?page=${page}&size=${size}`);
  return data;
};

export const createVehicle = async (vehicle) => {
  const { data } = await client.post('/vehicles', vehicle);
  return data;
};

export const getFuelHistory = async (id) => {
  const { data } = await client.get(`/vehicles/${id}/fuel-history`);
  return data;
};
