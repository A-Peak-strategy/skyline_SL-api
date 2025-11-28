"use strict";
// import { NextFunction, Request, Response } from "express";
// import { createOrder } from "../services/orderService";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateOrder = handleCreateOrder;
exports.handleGetOrders = handleGetOrders;
exports.handleGetOrderById = handleGetOrderById;
exports.handleUpdateOrderStatus = handleUpdateOrderStatus;
const orderService_1 = require("../services/orderService");
async function handleCreateOrder(req, res, next) {
    try {
        const orderData = req.body;
        // Validation
        if (!orderData.customerEmail || !orderData.customerEmail.trim()) {
            return res.status(400).json({ message: "Customer email is required" });
        }
        if (!orderData.productId || orderData.productId <= 0) {
            return res.status(400).json({ message: "Valid product ID is required" });
        }
        const order = await (0, orderService_1.createOrder)(orderData);
        res.status(201).json(order);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetOrders(req, res, next) {
    try {
        const orders = await (0, orderService_1.getOrders)();
        res.json(orders);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetOrderById(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        const order = await (0, orderService_1.getOrderById)(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    }
    catch (error) {
        next(error);
    }
}
async function handleUpdateOrderStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }
        const order = await (0, orderService_1.updateOrderStatus)(id, status);
        res.json(order);
    }
    catch (error) {
        next(error);
    }
}
