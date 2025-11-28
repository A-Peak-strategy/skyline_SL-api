import { Router } from "express";
import {
  handleCreateCategory,
  handleGetCategories,
  handleGetCategoryById,
  handleUpdateCategory,
  handleDeleteCategory
} from "../controllers/categoryController";

const router = Router();

router.get("/", handleGetCategories);
router.get("/:id", handleGetCategoryById);
router.post("/", handleCreateCategory);
router.put("/:id", handleUpdateCategory);
router.delete("/:id", handleDeleteCategory);

export default router;