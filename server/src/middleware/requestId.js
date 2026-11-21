export function requestId(req, res, next) {
  const requestId = req.header('X-Request-Id') || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
