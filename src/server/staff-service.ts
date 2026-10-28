import { prisma } from "@/lib/prisma";
import {
  StaffUser
} from "@/lib/types";

import { formatStaff } from "./formatters";

// Staff Authentication Queries
export async function authenticateStaff(input: {
  email?: string;
  password?: string;
  mode?: string;
  pin?: string;
}): Promise<StaffUser | null> {
  const searchEmail = input.email?.toLowerCase().trim() || "";
  if (!searchEmail || !input.password) return null;

  const user = await prisma.staffUser.findFirst({
    where: {
      email: { equals: searchEmail, mode: "insensitive" },
      password: input.password,
    },
  });
  return user ? formatStaff(user) : null;
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  const users = await prisma.staffUser.findMany({
    orderBy: { createdAt: "asc" },
  });
  return users.map(formatStaff);
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  role: "Accountant" | "Admin" | "Cashier";
  pin?: string;
  password?: string;
  title: string;
  avatar?: string;
}): Promise<StaffUser> {
  const user = await prisma.staffUser.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role || "Admin",
      pin: input.pin ? input.pin.trim() : "0000",
      password: input.password || "admin",
      title: input.title.trim(),
      avatar: input.avatar,
    },
  });
  return formatStaff(user);
}

export async function updateStaffUser(
  id: string,
  updates: Partial<{
    name: string;
    email: string;
    role: "Accountant" | "Admin" | "Cashier";
    pin: string;
    password?: string;
    title: string;
    avatar?: string;
  }>
): Promise<StaffUser> {
  const data: any = { ...updates };
  if (data.email) data.email = data.email.toLowerCase().trim();
  if (data.pin) data.pin = data.pin.trim();
  if (data.title) data.title = data.title.trim();

  const user = await prisma.staffUser.update({
    where: { id },
    data,
  });
  return formatStaff(user);
}

export async function deleteStaffUser(id: string): Promise<boolean> {
  const count = await prisma.staffUser.count();
  if (count <= 1) {
    throw new Error("Cannot delete the only remaining administrator account.");
  }
  await prisma.staffUser.delete({
    where: { id },
  });
  return true;
}
