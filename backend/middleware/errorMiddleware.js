const errorHandler = (err, req, res, next) => {
  // Terkadang error datang tanpa status code, jika ada gunakan, jika tidak set ke 500 (Server Error)
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Tampilkan stack hanya di mode development
  });
};

module.exports = { errorHandler };