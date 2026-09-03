import { Router } from "express";
import {
  handleGetProductById,
  handleGetProductBySlug,
  handleListProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
} from "../controllers/productController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";
import { uploadProductImages } from "../middleware/uploadMiddleware";

const router = Router();

router.get("/", handleListProducts);
router.get("/slug/:slug", handleGetProductBySlug);
router.get("/:id", handleGetProductById);
router.post("/", authenticateToken, requireAdmin, uploadProductImages, handleCreateProduct);
router.put("/:id", authenticateToken, requireAdmin, uploadProductImages, handleUpdateProduct);
router.delete("/:id", authenticateToken, requireAdmin, handleDeleteProduct);

export default router;
