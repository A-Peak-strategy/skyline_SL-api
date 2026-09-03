import { Router } from "express";
import {
  handleCreateBrand,
  handleGetBrands,
  handleGetBrandById,
  handleUpdateBrand,
  handleDeleteBrand
} from "../controllers/brandController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", handleGetBrands);
router.get("/:id", handleGetBrandById);
router.post("/", authenticateToken, requireAdmin, handleCreateBrand);
router.put("/:id", authenticateToken, requireAdmin, handleUpdateBrand);
router.delete("/:id", authenticateToken, requireAdmin, handleDeleteBrand);

export default router;
