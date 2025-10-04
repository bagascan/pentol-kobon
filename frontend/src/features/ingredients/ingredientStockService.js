import api from '../../api/axiosConfig';

// Get ingredient stock for a specific outlet
const getIngredientStockByOutlet = async (outletId) => {
  const response = await api.get(`/ingredient-stocks/${outletId}`);
  return response.data;
};

// Add or update ingredient stock in an outlet
// data = { ingredientId, outletId, quantity, cost }
const addOrUpdateIngredientStock = async (stockData) => {
  const response = await api.post('/ingredient-stocks', stockData);
  return response.data;
};

const ingredientStockService = {
  getIngredientStockByOutlet,
  addOrUpdateIngredientStock,
};

export default ingredientStockService;