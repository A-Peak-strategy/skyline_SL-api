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

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5173";

console.log("🚀 Starting server initialization...");
console.log("PORT:", PORT);
console.log("FRONTEND_ORIGIN:", FRONTEND_ORIGIN);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
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
  const status = typeof err?.status === "number" ? err.status : 500;
  const message =
    typeof err?.message === "string" && err.message.length > 0
      ? err.message
      : "Internal server error";
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`🎯 API server listening on http://localhost:${PORT}`);
});