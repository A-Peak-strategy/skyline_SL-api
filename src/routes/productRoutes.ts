import { Router } from "express";
import {
  handleGetProductById,
  handleGetProductBySlug,
  handleListProducts,
  handleCreateProduct,
} from "../controllers/productController";

const router = Router();

router.get("/", handleListProducts);
router.get("/slug/:slug", handleGetProductBySlug);
router.get("/:id", handleGetProductById);
router.post("/", handleCreateProduct);

export default router;
