import { Router } from "express";
import {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleUpdateOrderStatus
} from "../controllers/orderController";

const router = Router();

router.get("/", handleGetOrders);
router.get("/:id", handleGetOrderById);
router.post("/", handleCreateOrder);
router.patch("/:id/status", handleUpdateOrderStatus);

export default router;