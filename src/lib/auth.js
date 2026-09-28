import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'super_secret_viva_project_key_32_characters_minimum';

/**
 * Generate password hash and salt using built-in crypto.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify password against hash.
 */
export function verifyPassword(password, hash, salt) {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

/**
 * Create a signed session token (custom lightweight JWT).
 */
export function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours expiration
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(`${header}.${body}`);
  const signature = hmac.digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

/**
 * Verify a signed session token.
 */
export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, body, signature] = parts;
  
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(`${header}.${body}`);
  const expectedSignature = hmac.digest('base64url');
  
  if (signature !== expectedSignature) {
    return null; // Signature verification failed
  }
  
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (err) {
    return null; // Decoding/parsing failed
  }
}
