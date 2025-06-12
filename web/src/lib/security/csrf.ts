import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing operations
 */
export async function validateCSRFToken(
  request: NextRequest
): Promise<boolean> {
  try {
    // Get the JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      console.warn('CSRF validation failed: No valid session token');
      return false;
    }

    // Get CSRF token from header
    const csrfToken = request.headers.get('x-csrf-token');

    if (!csrfToken) {
      console.warn('CSRF validation failed: No CSRF token in headers');
      return false;
    }

    // SECURITY: Enhanced token validation with HMAC verification
    const expectedToken = generateCSRFToken(token.sub as string);

    // Decode and verify the token structure
    try {
      const decodedToken = Buffer.from(csrfToken, 'base64').toString('utf-8');
      const decodedExpected = Buffer.from(expectedToken, 'base64').toString(
        'utf-8'
      );

      // Extract timestamp from both tokens for time validation
      const tokenParts = decodedToken.split('.');
      const expectedParts = decodedExpected.split('.');

      if (tokenParts.length !== 2 || expectedParts.length !== 2) {
        console.warn('CSRF validation failed: Invalid token format');
        return false;
      }

      const [tokenPayload] = tokenParts;
      const [, tokenTimestamp] = tokenPayload.split(':');
      const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));

      // Allow tokens from current hour and previous hour (2 hour window)
      if (Math.abs(currentHour - parseInt(tokenTimestamp)) > 1) {
        console.warn('CSRF validation failed: Token timestamp expired');
        return false;
      }
    } catch (error) {
      console.warn('CSRF validation failed: Token decode error', error);
      return false;
    }

    if (csrfToken !== expectedToken) {
      console.warn('CSRF validation failed: Token mismatch');
      return false;
    }

    return true;
  } catch (error) {
    console.error('CSRF validation error:', error);
    return false;
  }
}

/**
 * Generate CSRF token based on user session
 * SECURITY: Enhanced cryptographic token generation
 */
export function generateCSRFToken(userId: string): string {
  const crypto = require('crypto');
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // Valid for 1 hour
  const nonce = crypto.randomBytes(16).toString('hex'); // Random nonce

  // SECURITY: Use HMAC-SHA256 for token generation
  const payload = `${userId}:${timestamp}:${nonce}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Format: payload.signature
  return Buffer.from(`${payload}.${signature}`).toString('base64');
}

/**
 * CSRF Protection Wrapper for API Routes
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const isValid = await validateCSRFToken(request);

      if (!isValid) {
        return new Response(
          JSON.stringify({
            error: 'CSRF token validation failed',
            code: 'CSRF_TOKEN_INVALID',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return handler(request);
  };
}
