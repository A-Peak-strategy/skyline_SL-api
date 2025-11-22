"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateContactMessage = handleCreateContactMessage;
const contactService_1 = require("../services/contactService");
async function handleCreateContactMessage(req, res, next) {
    try {
        const { name, email, phone, message } = req.body;
        if (!email ||
            typeof email !== "string" ||
            email.trim().length === 0 ||
            !message ||
            typeof message !== "string" ||
            message.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "email and message are required" });
        }
        const msg = await (0, contactService_1.createContactMessage)({
            name: typeof name === "string" ? name.trim() : undefined,
            email: email.trim(),
            phone: typeof phone === "string" ? phone.trim() : undefined,
            message: message.trim(),
        });
        res.status(201).json(msg);
    }
    catch (error) {
        next(error);
    }
}
