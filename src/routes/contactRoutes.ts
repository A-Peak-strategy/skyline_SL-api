import { Router } from "express";
import {
  handleCreateContactMessage,
  handleGetContactMessages,
  handleGetContactMessageById,
  handleDeleteContactMessage,
} from "../controllers/contactController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.post("/", handleCreateContactMessage);
router.get("/", authenticateToken, requireAdmin, handleGetContactMessages);
router.get("/:id", authenticateToken, requireAdmin, handleGetContactMessageById);
router.delete("/:id", authenticateToken, requireAdmin, handleDeleteContactMessage);

export default router;
