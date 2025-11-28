import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

export interface CreateOrderData {
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  productId: number;
  status?: OrderStatus;
}

export interface FrontendOrder {
  id: number;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  status: OrderStatus;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
  };
}

const ORDER_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      price: true,
      image: true,
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

export async function createOrder(data: CreateOrderData): Promise<FrontendOrder> {
  const {
    status = OrderStatus.NEW,
    ...orderData
  } = data;

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: orderData.productId },
  });

  if (!product) {
    throw new Error(`Product with ID ${orderData.productId} not found`);
  }

  // Check if product is available
  if (product.availabilityStatus !== 'AVAILABLE') {
    throw new Error(`Product ${product.name} is not available for order`);
  }

  const order = await prisma.order.create({
    data: {
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone||"",
      status,
      productId: orderData.productId,
    },
    include: ORDER_INCLUDE,
  });

  return mapDbOrderToFrontend(order);
}

export async function getOrders(): Promise<FrontendOrder[]> {
  const orders = await prisma.order.findMany({
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(mapDbOrderToFrontend);
}

export async function getOrderById(id: number): Promise<FrontendOrder | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });

  if (!order) {
    return null;
  }

  return mapDbOrderToFrontend(order);
}

export async function updateOrderStatus(
  id: number, 
  status: OrderStatus
): Promise<FrontendOrder> {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: ORDER_INCLUDE,
  });

  return mapDbOrderToFrontend(order);
}

function mapDbOrderToFrontend(order: OrderWithRelations): FrontendOrder {
  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    status: order.status,
    createdAt: order.createdAt,
    product: {
      id: order.product.id,
      name: order.product.name,
      price: Number(order.product.price),
      image: order.product.image,
    },
  };
}