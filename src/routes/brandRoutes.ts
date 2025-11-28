import { Router } from "express";
import {
  handleCreateBrand,
  handleGetBrands,
  handleGetBrandById,
  handleUpdateBrand,
  handleDeleteBrand
} from "../controllers/brandController";

const router = Router();

router.get("/", handleGetBrands);
router.get("/:id", handleGetBrandById);
router.post("/", handleCreateBrand);
router.put("/:id", handleUpdateBrand);
router.delete("/:id", handleDeleteBrand);

export default router;