import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import contactRoutes from "./routes/contactRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import brandRoutes from './routes/brandRoutes';
import vehicleModelRoutes from './routes/vehicleModelRoutes';
import userRoutes from './routes/userRoutes';
import { Prisma } from "@prisma/client";
import multer from "multer";
import { configureCloudinary } from "./config/cloudinary";

const app = express();
const PORT = process.env.PORT || 4000;
configureCloudinary();
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

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(Object.assign(new Error("Origin is not allowed by CORS"), { status: 403 }));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Auto Parts API is running" });
});

console.log("📌 Registering routes...");
app.use("/api/products", productRoutes);
console.log("✅ /api/products registered");

app.use("/api/orders", orderRoutes);
console.log("✅ /api/orders registered");

app.use("/api/contact", contactRoutes);
console.log("✅ /api/contact registered");

app.use("/api/categories", categoryRoutes);
console.log("✅ /api/categories registered");

app.use("/api/brands", brandRoutes);
console.log("✅ /api/brands registered");

app.use('/api/vehicle-models', vehicleModelRoutes);
console.log("✅ /api/vehicle-models registered");

app.use('/api/users', userRoutes);
console.log("✅ /api/users registered");

// Catch-all for 404
app.use((req, res) => {
  console.log("❌ 404 - No route found for:", req.method, req.path);
  res.status(404).json({ message: "Route not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("⚠️ Unhandled error:", err);
  let status = typeof err?.status === "number" ? err.status : 500;
  if (err instanceof multer.MulterError) status = 400;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") status = 409;
    if (err.code === "P2003") status = 409;
    if (err.code === "P2025") status = 404;
  }
  const message =
    typeof err?.message === "string" && err.message.length > 0
      ? err.message
      : "Internal server error";
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`🎯 API server listening on http://localhost:${PORT}`);
});
