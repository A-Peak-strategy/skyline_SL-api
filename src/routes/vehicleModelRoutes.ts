import { Router } from "express";
import {
  handleCreateVehicleModel,
  handleGetVehicleModels,
  handleGetVehicleModelById,
  handleUpdateVehicleModel,
  handleDeleteVehicleModel,
  handleGetVehicleModelsByBrand
} from "../controllers/vehicleModelController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", handleGetVehicleModels);
router.get("/brand/:brandId", handleGetVehicleModelsByBrand);
router.get("/:id", handleGetVehicleModelById);
router.post("/", authenticateToken, requireAdmin, handleCreateVehicleModel);
router.put("/:id", authenticateToken, requireAdmin, handleUpdateVehicleModel);
router.delete("/:id", authenticateToken, requireAdmin, handleDeleteVehicleModel);

export default router;
