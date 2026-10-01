import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique X-Request-ID header to every request for log correlation.
 */
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}
