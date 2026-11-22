export function requestId(req, res, next) {
  const crypto = globalThis.crypto;
  const requestId = req.header('X-Request-Id') || crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
