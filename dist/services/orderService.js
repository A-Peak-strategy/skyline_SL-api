"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.updateOrderStatus = updateOrderStatus;
const client_1 = require("@prisma/client");
const prismaClient_1 = require("../prismaClient");
const ORDER_INCLUDE = {
    product: {
        select: {
            id: true,
            name: true,
            price: true,
            image: true,
        },
    },
};
async function createOrder(data) {
    const { status = client_1.OrderStatus.NEW, ...orderData } = data;
    // Verify product exists
    const product = await prismaClient_1.prisma.product.findUnique({
        where: { id: orderData.productId },
    });
    if (!product) {
        throw new Error(`Product with ID ${orderData.productId} not found`);
    }
    // Check if product is available
    if (product.availabilityStatus !== 'AVAILABLE') {
        throw new Error(`Product ${product.name} is not available for order`);
    }
    const order = await prismaClient_1.prisma.order.create({
        data: {
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone || "",
            status,
            productId: orderData.productId,
        },
        include: ORDER_INCLUDE,
    });
    return mapDbOrderToFrontend(order);
}
async function getOrders() {
    const orders = await prismaClient_1.prisma.order.findMany({
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapDbOrderToFrontend);
}
async function getOrderById(id) {
    const order = await prismaClient_1.prisma.order.findUnique({
        where: { id },
        include: ORDER_INCLUDE,
    });
    if (!order) {
        return null;
    }
    return mapDbOrderToFrontend(order);
}
async function updateOrderStatus(id, status) {
    const order = await prismaClient_1.prisma.order.update({
        where: { id },
        data: { status },
        include: ORDER_INCLUDE,
    });
    return mapDbOrderToFrontend(order);
}
function mapDbOrderToFrontend(order) {
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
