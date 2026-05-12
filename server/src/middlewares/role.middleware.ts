import { Role } from "../types/enums";

import { authorizeRoles } from "./auth.middleware";

export function requireRole(...roles: Role[]) {
  return authorizeRoles(...roles);
}
