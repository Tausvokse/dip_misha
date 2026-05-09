import type { Role } from "@prisma/client";
import { authorizeRoles } from "./auth.middleware";

export function requireRole(...roles: Role[]) {
  return authorizeRoles(...roles);
}
