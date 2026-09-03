import { prisma } from "../prismaClient";

interface CreateContactInput {
  name?: string;
  email: string;
  phone?: string;
  message: string;
}

export async function createContactMessage(input: CreateContactInput) {
  const { name, email, phone, message } = input;

  const msg = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone,
      message,
    },
  });

  return msg;
}

export function getContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export function getContactMessageById(id: number) {
  return prisma.contactMessage.findUnique({ where: { id } });
}

export async function deleteContactMessage(id: number) {
  const message = await prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });
  await prisma.contactMessage.delete({ where: { id } });
}
