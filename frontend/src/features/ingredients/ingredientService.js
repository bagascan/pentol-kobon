import api from '../../api/axiosConfig';

// Create new ingredient
const createIngredient = async (ingredientData) => {
  const response = await api.post('/ingredients', ingredientData);
  return response.data;
};

// Get all ingredients
const getIngredients = async () => {
  const response = await api.get('/ingredients');
  return response.data;
};

// Update an ingredient
const updateIngredient = async (ingredientId, ingredientData) => {
  const response = await api.put(`/ingredients/${ingredientId}`, ingredientData);
  return response.data;
};

// Delete an ingredient
const deleteIngredient = async (ingredientId) => {
  const response = await api.delete(`/ingredients/${ingredientId}`);
  return response.data;
};

const ingredientService = {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
};

export default ingredientService;

