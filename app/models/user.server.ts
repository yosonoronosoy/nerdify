import type { User } from "@prisma/client";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserBySpotifyId(spotifyUserId: User["spotifyUserId"]) {
  return prisma.user.findUnique({ where: { spotifyUserId } });
}

export async function createUser(user: Pick<User, "email" | "spotifyUserId">) {
  return prisma.user.create({
    data: user,
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}
