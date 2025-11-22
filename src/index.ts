import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import contactRoutes from "./routes/contactRoutes";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5173";

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

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  const status = typeof err?.status === "number" ? err.status : 500;
  const message =
    typeof err?.message === "string" && err.message.length > 0
      ? err.message
      : "Internal server error";
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
