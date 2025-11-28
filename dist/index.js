"use strict";
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// dotenv.config();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import productRoutes from "./routes/productRoutes";
// import orderRoutes from "./routes/orderRoutes";
// import contactRoutes from "./routes/contactRoutes";
// import categoryRoutes from "./routes/categoryRoutes";
// import brandRoutes from './routes/brandRoutes';
// const app = express();
// const PORT = process.env.PORT || 4000;
// const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5173";
// app.use(
//   cors({
//     origin: FRONTEND_ORIGIN,
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.get("/", (_req, res) => {
//   res.json({ status: "ok", message: "Auto Parts API is running" });
// });
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/brands", brandRoutes);
// // for debug purpose
// app.use("/api/brands", (req, res, next) => {
//   console.log("Brand route hit:", req.method, req.path);
//   next();
// }, brandRoutes);
// app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
//   console.error("Unhandled error:", err);
//   const status = typeof err?.status === "number" ? err.status : 500;
//   const message =
//     typeof err?.message === "string" && err.message.length > 0
//       ? err.message
//       : "Internal server error";
//   res.status(status).json({ message });
// });
// app.listen(PORT, () => {
//   console.log(`API server listening on http://localhost:${PORT}`);
// });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const brandRoutes_1 = __importDefault(require("./routes/brandRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5173";
console.log("🚀 Starting server initialization...");
console.log("PORT:", PORT);
console.log("FRONTEND_ORIGIN:", FRONTEND_ORIGIN);
app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "Auto Parts API is running" });
});
console.log("📌 Registering routes...");
app.use("/api/products", productRoutes_1.default);
console.log("✅ /api/products registered");
app.use("/api/orders", orderRoutes_1.default);
console.log("✅ /api/orders registered");
app.use("/api/contact", contactRoutes_1.default);
console.log("✅ /api/contact registered");
app.use("/api/categories", categoryRoutes_1.default);
console.log("✅ /api/categories registered");
app.use("/api/brands", brandRoutes_1.default);
console.log("✅ /api/brands registered");
// Catch-all for 404
app.use((req, res) => {
    console.log("❌ 404 - No route found for:", req.method, req.path);
    res.status(404).json({ message: "Route not found" });
});
app.use((err, _req, res, _next) => {
    console.error("⚠️ Unhandled error:", err);
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = typeof err?.message === "string" && err.message.length > 0
        ? err.message
        : "Internal server error";
    res.status(status).json({ message });
});
app.listen(PORT, () => {
    console.log(`🎯 API server listening on http://localhost:${PORT}`);
});
