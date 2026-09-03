"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactMessage = createContactMessage;
exports.getContactMessages = getContactMessages;
exports.getContactMessageById = getContactMessageById;
exports.deleteContactMessage = deleteContactMessage;
const prismaClient_1 = require("../prismaClient");
async function createContactMessage(input) {
    const { name, email, phone, message } = input;
    const msg = await prismaClient_1.prisma.contactMessage.create({
        data: {
            name,
            email,
            phone,
            message,
        },
    });
    return msg;
}
function getContactMessages() {
    return prismaClient_1.prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}
function getContactMessageById(id) {
    return prismaClient_1.prisma.contactMessage.findUnique({ where: { id } });
}
async function deleteContactMessage(id) {
    const message = await prismaClient_1.prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
    if (!message)
        throw Object.assign(new Error("Message not found"), { status: 404 });
    await prismaClient_1.prisma.contactMessage.delete({ where: { id } });
}
