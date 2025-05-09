/**
 * Authentication middleware
 * Verifies Firebase ID token and checks if user is approved in the database
 */
const auth = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extract token
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify Firebase token
    const decodedToken = await req.admin.auth().verifyIdToken(idToken);
    
    // Get user email from decoded token
    const userEmail = decodedToken.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'Token does not contain an email' });
    }
    
    // Check if user exists and is approved in the database
    const user = await req.db('users')
      .where({ email: userEmail })
      .first();
    
    if (!user) {
      return res.status(403).json({ error: 'User not found in database' });
    }
    
    if (!user.approved) {
      return res.status(403).json({ error: 'User not approved' });
    }
    
    // Attach user info to request object
    req.user = {
      id: user.id,
      email: userEmail,
      role: user.role,
      uid: decodedToken.uid
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has one of the allowed roles
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  auth,
  authorize
}; 