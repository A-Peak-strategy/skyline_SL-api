import { Router } from "express";
import {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleUpdateOrderStatus
} from "../controllers/orderController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, requireAdmin, handleGetOrders);
router.get("/:id", authenticateToken, requireAdmin, handleGetOrderById);
router.post("/", handleCreateOrder);
router.patch("/:id/status", authenticateToken, requireAdmin, handleUpdateOrderStatus);

export default router;
