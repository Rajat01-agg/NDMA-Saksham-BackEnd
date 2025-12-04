const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Extract status and message
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  // Include validation details if available
  const response = {
    success: false,
    status: status,
    message: message
  };
  
  if (err.details && Array.isArray(err.details)) {
    response.details = err.details;
  }
  
  res.status(status).json(response);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};