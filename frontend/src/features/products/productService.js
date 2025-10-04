import api from '../../api/axiosConfig';

const API_ENDPOINT = 'products/';

// Create new product
const createProduct = async (productData) => {
  const response = await api.post(API_ENDPOINT, productData);
  return response.data;
};

// Get all products for the logged-in user
const getProducts = async () => {
  const response = await api.get(API_ENDPOINT);
  return response.data;
};

// Delete a product
const deleteProduct = async (productId) => {
  const response = await api.delete(API_ENDPOINT + productId);
  return response.data;
};

// Update a product
const updateProduct = async (productId, productData) => {
  const response = await api.put(API_ENDPOINT + productId, productData);
  return response.data;
};

const productService = {
  createProduct,
  getProducts,
  deleteProduct,
  updateProduct,
};

export default productService;