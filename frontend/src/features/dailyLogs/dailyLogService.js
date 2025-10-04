import api from '../../api/axiosConfig';

// Start a new daily session
const startDaySession = async (logData) => {
  const response = await api.post('/dailylogs/start', logData);
  return response.data;
};

// Get today's active session for a specific outlet
const getTodaySession = async (outletId) => {
  const response = await api.get(`/dailylogs/today?outletId=${outletId}`);
  return response.data;
};

// Update a daily session
const updateDaySession = async (logId, logData) => {
  const response = await api.put(`/dailylogs/${logId}`, logData);
  return response.data;
};

// Delete/reset a daily session
const deleteDaySession = async (logId) => {
  const response = await api.delete(`/dailylogs/${logId}`);
  return response.data;
};

// Close a daily session
const closeDaySession = async (logData) => {
  const response = await api.put('/dailylogs/close', logData);
  return response.data;
};

// Get all logs for reports
const getLogs = async () => {
  const response = await api.get('/dailylogs');
  return response.data;
};

// --- FUNGSI BARU YANG HILANG ---
// Get all open sessions for the owner
const getOpenSessions = async () => {
  const response = await api.get('/dailylogs/open');
  return response.data;
};

const dailyLogService = {
  startDaySession,
  getTodaySession,
  updateDaySession,
  deleteDaySession,
  closeDaySession,
  getLogs,
  getOpenSessions, // <-- Pastikan diekspor
};

export default dailyLogService;
