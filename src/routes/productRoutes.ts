import { Router } from "express";
import {
  handleGetProductById,
  handleGetProductBySlug,
  handleListProducts,
} from "../controllers/productController";

const router = Router();

router.get("/", handleListProducts);
router.get("/slug/:slug", handleGetProductBySlug);
router.get("/:id", handleGetProductById);

export default router;
