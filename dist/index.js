"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5173";
app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "Auto Parts API is running" });
});
app.use("/api/products", productRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/contact", contactRoutes_1.default);
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = typeof err?.message === "string" && err.message.length > 0
        ? err.message
        : "Internal server error";
    res.status(status).json({ message });
});
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});
