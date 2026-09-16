import jwt from "jsonwebtoken";

export function getAuthJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is required and must be separate from Supabase credentials.");
  }
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_JWT_SECRET must contain at least 32 bytes.");
  }
  return secret;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  cpfCnpj?: string;
  name?: string;
  role?: "USER" | "ADMIN";
}

/**
 * Verifies the Bearer token in the Authorization header (same secret used by
 * /api/auth/login and /api/auth/register to sign it). Returns the decoded
 * payload, or null when the header is missing or the token is invalid/expired.
 */
export function verifyAuthToken(req: Request): AuthTokenPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.substring(7), getAuthJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}
