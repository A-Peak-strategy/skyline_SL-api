import { NextFunction, Request, Response } from "express";
import { createOrder } from "../services/orderService";

export async function handleCreateOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId, customerName, customerEmail, customerPhone } = req.body;

    const parsedProductId = Number(productId);
    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      return res.status(400).json({
        message: "productId must be a valid number",
      });
    }

    if (
      !customerEmail ||
      typeof customerEmail !== "string" ||
      customerEmail.trim().length === 0
    ) {
      return res.status(400).json({ message: "customerEmail is required" });
    }

    if (
      !customerPhone ||
      typeof customerPhone !== "string" ||
      customerPhone.trim().length === 0
    ) {
      return res.status(400).json({ message: "customerPhone is required" });
    }

    const order = await createOrder({
      productId: parsedProductId,
      customerName: customerName?.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
    });

    if (!order) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}
