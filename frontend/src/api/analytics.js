import client from './client';

export const getDashboardSummary = async () => {
  const { data } = await client.get('/analytics/dashboard/summary');
  return data;
};

export const getEmissionsOverTime = async () => {
  const { data } = await client.get('/analytics/emissions-over-time');
  return data;
};

export const getByTransportMode = async () => {
  const { data } = await client.get('/analytics/by-transport-mode');
  return data;
};

export const getTopPollutingRoutes = async () => {
  const { data } = await client.get('/analytics/top-polluting-routes');
  return data;
};

export const getEsgReport = async () => {
  const { data } = await client.get('/analytics/reports/esg');
  return data;
};
