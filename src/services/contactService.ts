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
