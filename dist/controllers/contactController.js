"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateContactMessage = handleCreateContactMessage;
exports.handleGetContactMessages = handleGetContactMessages;
exports.handleGetContactMessageById = handleGetContactMessageById;
exports.handleDeleteContactMessage = handleDeleteContactMessage;
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
async function handleGetContactMessages(_req, res, next) {
    try {
        res.json(await (0, contactService_1.getContactMessages)());
    }
    catch (error) {
        next(error);
    }
}
async function handleGetContactMessageById(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return res.status(400).json({ message: "Invalid message id" });
        const message = await (0, contactService_1.getContactMessageById)(id);
        if (!message)
            return res.status(404).json({ message: "Message not found" });
        res.json(message);
    }
    catch (error) {
        next(error);
    }
}
async function handleDeleteContactMessage(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0)
            return res.status(400).json({ message: "Invalid message id" });
        await (0, contactService_1.deleteContactMessage)(id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
