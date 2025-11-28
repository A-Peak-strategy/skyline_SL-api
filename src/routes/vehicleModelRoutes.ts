import { Router } from "express";
import {
  handleCreateVehicleModel,
  handleGetVehicleModels,
  handleGetVehicleModelById,
  handleUpdateVehicleModel,
  handleDeleteVehicleModel,
  handleGetVehicleModelsByBrand
} from "../controllers/vehicleModelController";

const router = Router();

router.get("/", handleGetVehicleModels);
router.get("/brand/:brandId", handleGetVehicleModelsByBrand);
router.get("/:id", handleGetVehicleModelById);
router.post("/", handleCreateVehicleModel);
router.put("/:id", handleUpdateVehicleModel);
router.delete("/:id", handleDeleteVehicleModel);

export default router;