"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
const prismaClient_1 = require("../prismaClient");
async function createOrder(input) {
    const { productId, customerName, customerEmail, customerPhone } = input;
    const productExists = await prismaClient_1.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
    });
    if (!productExists) {
        return null;
    }
    const order = await prismaClient_1.prisma.order.create({
        data: {
            productId,
            customerName,
            customerEmail,
            customerPhone,
        },
    });
    return order;
}
