/**
 * Sanitization middleware
 * Strips MongoDB operators ($ and .) from query/body to prevent NoSQL injection.
 * Recursively trims strings.
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      // Prevent MongoDB operator injection in keys
      if (!key.startsWith('$') && !key.includes('.')) {
        clean[key] = sanitizeValue(val);
      }
    }
    return clean;
  }
  return value;
}

export function sanitizeInputs(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

export default sanitizeInputs;
