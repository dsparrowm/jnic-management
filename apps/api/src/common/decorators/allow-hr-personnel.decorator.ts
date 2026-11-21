import { SetMetadata } from "@nestjs/common";

export const HR_PERSONNEL_ALLOWED_KEY = "hrPersonnelAllowed";

/**
 * Marks a route where HR directorate personnel may pass the global RolesGuard.
 * The global guard falls back to an HR-seat check only on routes carrying this
 * marker, so HR access stays scoped to the endpoints that need it.
 */
export const AllowHrPersonnel = () =>
  SetMetadata(HR_PERSONNEL_ALLOWED_KEY, true);
