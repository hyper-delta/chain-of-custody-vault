export function errorHandler(error, req, res, _next) {
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';
  if (status >= 500) {
    req.log?.error({ err: error, requestId: req.requestId }, 'Unhandled request error');
  }
  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? 'Unexpected server error.' : error.message,
      details: status >= 500 ? null : (error.details || null),
      requestId: req.requestId,
    },
  });
}
