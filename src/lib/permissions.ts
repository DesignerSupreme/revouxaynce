export type Role = "admin" | "planner" | "assistant" | "viewer";

export const ROLES: Role[] = ["admin", "planner", "assistant", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  planner: "Planner",
  assistant: "Assistant",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Full access, manages people and permanently removes records.",
  planner: "Creates and edits everything except team permissions.",
  assistant: "Adds and edits tasks, guests and expenses only.",
  viewer: "Read-only access to everything.",
};

/** Sections an assistant may change. */
const ASSISTANT_SECTIONS = ["tasks", "guests", "expenses"];

export const isAdmin = (role: Role): boolean => role === "admin";

/** Planner-level write access (clients, events, vendors, invoices, brand). */
export const canWrite = (role: Role): boolean => role === "admin" || role === "planner";

/** Whether the role may change records in a given section. */
export function canEdit(role: Role, section: string): boolean {
  if (canWrite(role)) return true;
  if (role === "assistant") return ASSISTANT_SECTIONS.includes(section);
  return false;
}

/** Only admins may permanently erase; everyone with edit rights can soft-delete. */
export const canDelete = (role: Role, section: string): boolean => canEdit(role, section);
export const canPurge = (role: Role): boolean => role === "admin";
