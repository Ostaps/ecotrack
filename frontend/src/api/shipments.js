import client from './client';

export const getShipments = async (params = {}) => {
  const { data } = await client.get('/shipments', { params });
  return data;
};

export const createShipment = async (shipment) => {
  const { data } = await client.post('/shipments', shipment);
  return data;
};

export const getShipmentDetail = async (id) => {
  const { data } = await client.get(`/shipments/${id}`);
  return data;
};

export const getLiveShipments = async () => {
  const { data } = await client.get('/shipments/live');
  return data;
};
