import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-jwt-secret-key-2026-secure";

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
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

/** Same as verifyAuthToken, but additionally requires role === "ADMIN". */
export function verifyAdminToken(req: Request): AuthTokenPayload | null {
  const payload = verifyAuthToken(req);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}
