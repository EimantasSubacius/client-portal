import type { Invoice, Project, Role, User } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export function canViewProject(
  user: SessionUser,
  project: Pick<Project, "clientUserId">,
): boolean {
  if (user.role === "ADMIN") return true;
  return project.clientUserId === user.id;
}

export function canEditProject(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canUploadFile(
  user: SessionUser,
  project: Pick<Project, "clientUserId">,
): boolean {
  return canViewProject(user, project);
}

export function canDeleteFile(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canManageInvoice(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canViewInvoice(
  user: SessionUser,
  invoice: Pick<Invoice, "clientUserId">,
): boolean {
  if (user.role === "ADMIN") return true;
  return invoice.clientUserId === user.id;
}

export function canManageClients(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function isAdmin(user: SessionUser | User): boolean {
  return user.role === "ADMIN";
}
