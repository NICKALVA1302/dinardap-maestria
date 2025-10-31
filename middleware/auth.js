const jwt = require('jsonwebtoken');
const ipaddr = require('ipaddr.js');

function parseClients(raw) {
  return (raw || '').split(',').map(s => s.trim()).filter(Boolean).map(c => {
    const [id, secret] = c.split(':');
    return { id, secret };
  });
}

function parseClientIP(req) {
  // En AWS con ALB/CloudFront, X-Forwarded-For tiene la IP del cliente primero
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0]; // Primera IP es la del cliente
  }
  return req.ip || req.connection.remoteAddress || '';
}

function ipInWhitelist(req) {
  const raw = process.env.IP_WHITELIST || '';
  if (!raw) return true; // no whitelist configured
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const clientIP = parseClientIP(req);
  if (!clientIP) return false;

  try {
    const clientAddr = ipaddr.parse(clientIP);
    for (const p of parts) {
      if (p.includes('/')) {
        // CIDR: e.g., 192.168.1.0/24
        const range = ipaddr.parseCIDR(p);
        if (clientAddr.kind() === range[0].kind() && clientAddr.match(range)) {
          return true;
        }
      } else {
        // Exact IP or prefix
        if (clientIP === p || clientIP.startsWith(p)) {
          return true;
        }
      }
    }
  } catch (err) {
    console.error('Error parsing IP:', err);
    return false;
  }
  return false;
}

function authMiddleware(req, res, next) {
  if (!ipInWhitelist(req)) {
    return res.status(403).json({ success: false, message: 'IP not allowed' });
  }

  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  const token = auth.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    req.auth = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

function requireScope(scope) {
  return (req, res, next) => {
    const payload = req.auth || {};
    const scopes = (payload.scope || '').split(/\s+/);
    if (scopes.includes(scope) || scopes.includes('dinardap:all')) return next();
    return res.status(403).json({ success: false, message: 'No tiene permisos para acceder a este recurso' });
  };
}

module.exports = { authMiddleware, requireScope };
