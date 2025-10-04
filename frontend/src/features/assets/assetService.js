import api from '../../api/axiosConfig';

const getAssets = async () => {
  const response = await api.get('/assets');
  return response.data;
};

const createAsset = async (assetData) => {
  const response = await api.post('/assets', assetData);
  return response.data;
};

const updateAsset = async (id, assetData) => {
  const response = await api.put(`/assets/${id}`, assetData);
  return response.data;
};

const deleteAsset = async (id) => {
  const response = await api.delete(`/assets/${id}`);
  return response.data;
};

const assetService = { getAssets, createAsset, updateAsset, deleteAsset };

export default assetService;