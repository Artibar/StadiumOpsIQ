const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  console.error("[ERROR] Express caught error:", err.stack || err.message || err);
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    stack: isDev ? err.stack : undefined
  });
};

export default errorHandler;
