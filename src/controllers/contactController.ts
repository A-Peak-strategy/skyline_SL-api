import { NextFunction, Request, Response } from "express";
import {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  deleteContactMessage,
} from "../services/contactService";

export async function handleCreateContactMessage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, phone, message } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      email.trim().length === 0 ||
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ message: "email and message are required" });
    }

    const msg = await createContactMessage({
      name: typeof name === "string" ? name.trim() : undefined,
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      message: message.trim(),
    });

    res.status(201).json(msg);
  } catch (error) {
    next(error);
  }
}

export async function handleGetContactMessages(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getContactMessages());
  } catch (error) {
    next(error);
  }
}

export async function handleGetContactMessageById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid message id" });
    const message = await getContactMessageById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json(message);
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteContactMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid message id" });
    await deleteContactMessage(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
