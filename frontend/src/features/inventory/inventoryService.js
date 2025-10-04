import api from '../../api/axiosConfig';

// Get inventory (products and stock) for a specific outlet
const getInventoryByOutlet = async (outletId) => {
  const response = await api.get(`/inventory/${outletId}`);
  return response.data;
};

// Add a product to an outlet's inventory or update its stock
const addOrUpdateInventory = async (inventoryData) => {
  // inventoryData should be { productId, outletId, stock }
  const response = await api.post('/inventory', inventoryData);
  return response.data;
};

const inventoryService = {
  getInventoryByOutlet,
  addOrUpdateInventory,
};

export default inventoryService;

