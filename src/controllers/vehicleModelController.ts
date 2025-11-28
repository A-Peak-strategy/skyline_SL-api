import { NextFunction, Request, Response } from "express";
import {
  createVehicleModel,
  getVehicleModels,
  getVehicleModelById,
  getVehicleModelsByBrand,
  updateVehicleModel,
  deleteVehicleModel,
  CreateVehicleModelData,
  UpdateVehicleModelData
} from "../services/vehicleModelService";

export async function handleCreateVehicleModel(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const modelData: CreateVehicleModelData = req.body;

    // Validation
    if (!modelData.name || !modelData.name.trim()) {
      return res.status(400).json({ message: "Model name is required" });
    }

    if (!modelData.brandId || modelData.brandId <= 0) {
      return res.status(400).json({ message: "Valid brand ID is required" });
    }

    const vehicleModel = await createVehicleModel(modelData);
    res.status(201).json({
      message: "Vehicle model created successfully",
      vehicleModel
    });
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes("Brand not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleGetVehicleModels(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vehicleModels = await getVehicleModels();
    res.json({
      message: "Vehicle models retrieved successfully",
      vehicleModels,
      count: vehicleModels.length
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetVehicleModelsByBrand(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const brandId = Number(req.params.brandId);
    if (!Number.isInteger(brandId) || brandId <= 0) {
      return res.status(400).json({ message: "Invalid brand ID" });
    }

    const vehicleModels = await getVehicleModelsByBrand(brandId);
    res.json({
      message: "Vehicle models retrieved successfully",
      vehicleModels,
      count: vehicleModels.length
    });
  } catch (error: any) {
    if (error.message.includes("Brand not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleGetVehicleModelById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid vehicle model ID" });
    }

    const vehicleModel = await getVehicleModelById(id);
    if (!vehicleModel) {
      return res.status(404).json({ message: "Vehicle model not found" });
    }

    res.json({
      message: "Vehicle model retrieved successfully",
      vehicleModel
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateVehicleModel(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    const modelData: UpdateVehicleModelData = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid vehicle model ID" });
    }

    if (modelData.name && !modelData.name.trim()) {
      return res.status(400).json({ message: "Model name cannot be empty" });
    }

    const vehicleModel = await updateVehicleModel(id, modelData);
    res.json({
      message: "Vehicle model updated successfully",
      vehicleModel
    });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleDeleteVehicleModel(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid vehicle model ID" });
    }

    await deleteVehicleModel(id);
    res.json({
      message: "Vehicle model deleted successfully"
    });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("has products")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}