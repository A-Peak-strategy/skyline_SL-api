"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactMessage = createContactMessage;
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
