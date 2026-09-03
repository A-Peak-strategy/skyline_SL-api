import { NextFunction, Request, Response } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  CreateOrderData
} from "../services/orderService";
import { OrderStatus } from "@prisma/client";

export async function handleCreateOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const orderData: CreateOrderData = req.body;

    // Validation
    if (!orderData.customerEmail || !orderData.customerEmail.trim()) {
      return res.status(400).json({ message: "Customer email is required" });
    }

    if (!orderData.productId || orderData.productId <= 0) {
      return res.status(400).json({ message: "Valid product ID is required" });
    }

    const order = await createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function handleGetOrders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function handleGetOrderById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await updateOrderStatus(id, status);
    res.json(order);
  } catch (error) {
    next(error);
  }
}
