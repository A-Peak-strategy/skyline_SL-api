import { prisma } from "../prismaClient";

interface CreateOrderInput {
  productId: number;
  customerName?: string;
  customerEmail: string;
  customerPhone: string;
}

export async function createOrder(input: CreateOrderInput) {
  const { productId, customerName, customerEmail, customerPhone } = input;

  const productExists = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!productExists) {
    return null;
  }

  const order = await prisma.order.create({
    data: {
      productId,
      customerName,
      customerEmail,
      customerPhone,
    },
  });

  return order;
}
