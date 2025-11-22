import { NextFunction, Request, Response } from "express";
import { createContactMessage } from "../services/contactService";

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
