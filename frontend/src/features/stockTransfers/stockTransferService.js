import api from '../../api/axiosConfig';

// Create a new stock transfer
const createStockTransfer = async (transferData) => {
  const response = await api.post('/stock-transfers', transferData);
  return response.data;
};

// Get all stock transfers history
const getTransfers = async () => {
  const response = await api.get('/stock-transfers');
  return response.data;
};

const stockTransferService = {
  createStockTransfer,
  getTransfers,
};

export default stockTransferService;
