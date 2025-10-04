import api from '../../api/axiosConfig';

// @desc    Create new transaction
const createTransaction = async (transactionData) => {
  const response = await api.post('/transactions', transactionData);
  return response.data;
};

// @desc    Get total sales for the current active session
const getSessionSales = async (outletId) => {
  const response = await api.get(`/transactions/session-sales?outletId=${outletId}`);
  return response.data;
};



// @desc    Get all transactions for reports
const getTransactions = async (filter = {}) => {
  // Ubah objek filter menjadi string query URL yang valid
  const params = new URLSearchParams();
  Object.keys(filter).forEach(key => {
    if (filter[key]) params.append(key, filter[key]);
  });
  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
}

const transactionService = {
  createTransaction,
  getSessionSales,
  getTransactions,
};

export default transactionService;
