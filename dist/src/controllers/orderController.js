"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateOrder = handleCreateOrder;
const orderService_1 = require("../services/orderService");
async function handleCreateOrder(req, res, next) {
    try {
        const { productId, customerName, customerEmail, customerPhone } = req.body;
        const parsedProductId = Number(productId);
        if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
            return res.status(400).json({
                message: "productId must be a valid number",
            });
        }
        if (!customerEmail ||
            typeof customerEmail !== "string" ||
            customerEmail.trim().length === 0) {
            return res.status(400).json({ message: "customerEmail is required" });
        }
        if (!customerPhone ||
            typeof customerPhone !== "string" ||
            customerPhone.trim().length === 0) {
            return res.status(400).json({ message: "customerPhone is required" });
        }
        const order = await (0, orderService_1.createOrder)({
            productId: parsedProductId,
            customerName: customerName?.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone.trim(),
        });
        if (!order) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(201).json(order);
    }
    catch (error) {
        next(error);
    }
}
