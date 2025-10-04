import api from '../../api/axiosConfig';

// Get all outlets for the owner
const getOutlets = async () => {
  const response = await api.get('/outlets');
  return response.data;
};

// Create a new outlet
const createOutlet = async (outletData) => {
  const response = await api.post('/outlets', outletData);
  return response.data;
};

// Update an outlet
const updateOutlet = async (outletId, outletData) => {
  const response = await api.put(`/outlets/${outletId}`, outletData);
  return response.data;
};

// Delete an outlet
const deleteOutlet = async (outletId) => {
  const response = await api.delete(`/outlets/${outletId}`);
  return response.data;
};

const outletService = {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
};

export default outletService;

