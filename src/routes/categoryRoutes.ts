import { Router } from "express";
import {
  handleCreateCategory,
  handleGetCategories,
  handleGetCategoryById,
  handleUpdateCategory,
  handleDeleteCategory
} from "../controllers/categoryController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", handleGetCategories);
router.get("/:id", handleGetCategoryById);
router.post("/", authenticateToken, requireAdmin, handleCreateCategory);
router.put("/:id", authenticateToken, requireAdmin, handleUpdateCategory);
router.delete("/:id", authenticateToken, requireAdmin, handleDeleteCategory);

export default router;
