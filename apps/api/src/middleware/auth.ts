import { GetVerificationKey, expressjwt } from "express-jwt";
import { expressJwtSecret } from "jwks-rsa";

const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE;
const AUTH_DOMAIN = process.env.AUTH_DOMAIN;

// Create middleware for checking the JWT
export const auth = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 2,
    jwksUri: `${AUTH_DOMAIN}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  // Validate the audience and the issuer.
  audience: AUTH_AUDIENCE,
  issuer: AUTH_DOMAIN,
  algorithms: ["ES256", "RS256", "HS256"],
});
