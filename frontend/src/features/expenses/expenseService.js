import api from '../../api/axiosConfig';

// Create new expense
const createExpense = async (expenseData) => {
  const response = await api.post('/expenses', expenseData);
  return response.data;
};

// Get expenses
const getExpenses = async (outletId) => {
  const response = await api.get(`/expenses?outletId=${outletId}`);
  return response.data;
};

// Update an expense
const updateExpense = async (expenseId, expenseData) => {
  const response = await api.put(`/expenses/${expenseId}`, expenseData);
  return response.data;
};

// Delete an expense
const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};

const expenseService = { createExpense, getExpenses, updateExpense, deleteExpense };

export default expenseService;