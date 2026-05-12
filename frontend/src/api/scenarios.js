import client from './client';

export const compareScenarios = async (scenarios) => {
  const { data } = await client.post('/scenarios/compare', scenarios);
  return data;
};
