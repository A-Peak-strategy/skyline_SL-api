"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const brandRoutes_1 = __importDefault(require("./routes/brandRoutes"));
const vehicleModelRoutes_1 = __importDefault(require("./routes/vehicleModelRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    ...(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "").split(","),
]
    .map((origin) => origin.trim())
    .filter((origin, index, origins) => Boolean(origin) && origins.indexOf(origin) === index);
console.log("🚀 Starting server initialization...");
console.log("PORT:", PORT);
console.log("ALLOWED_ORIGINS:", allowedOrigins.join(", "));
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
        callback(Object.assign(new Error("Origin is not allowed by CORS"), { status: 403 }));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
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
app.use('/api/vehicle-models', vehicleModelRoutes_1.default);
console.log("✅ /api/vehicle-models registered");
app.use('/api/users', userRoutes_1.default);
console.log("✅ /api/users registered");
// Catch-all for 404
app.use((req, res) => {
    console.log("❌ 404 - No route found for:", req.method, req.path);
    res.status(404).json({ message: "Route not found" });
});
app.use((err, _req, res, _next) => {
    console.error("⚠️ Unhandled error:", err);
    let status = typeof err?.status === "number" ? err.status : 500;
    if (err instanceof multer_1.default.MulterError)
        status = 400;
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002")
            status = 409;
        if (err.code === "P2003")
            status = 409;
        if (err.code === "P2025")
            status = 404;
    }
    const message = typeof err?.message === "string" && err.message.length > 0
        ? err.message
        : "Internal server error";
    res.status(status).json({ message });
});
app.listen(PORT, () => {
    console.log(`🎯 API server listening on http://localhost:${PORT}`);
});
