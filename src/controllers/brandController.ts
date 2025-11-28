import { NextFunction, Request, Response } from "express";
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  CreateBrandData,
  UpdateBrandData
} from "../services/brandService";

export async function handleCreateBrand(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const brandData: CreateBrandData = req.body;

    // Validation
    if (!brandData.name || !brandData.name.trim()) {
      return res.status(400).json({ message: "Brand name is required" });
    }

    const brand = await createBrand(brandData);
    res.status(201).json({
      message: "Brand created successfully",
      brand
    });
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleGetBrands(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const brands = await getBrands();
    res.json({
      message: "Brands retrieved successfully",
      brands,
      count: brands.length
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetBrandById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid brand ID" });
    }

    const brand = await getBrandById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({
      message: "Brand retrieved successfully",
      brand
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateBrand(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    const brandData: UpdateBrandData = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid brand ID" });
    }

    if (brandData.name && !brandData.name.trim()) {
      return res.status(400).json({ message: "Brand name cannot be empty" });
    }

    const brand = await updateBrand(id, brandData);
    res.json({
      message: "Brand updated successfully",
      brand
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

export async function handleDeleteBrand(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid brand ID" });
    }

    await deleteBrand(id);
    res.json({
      message: "Brand deleted successfully"
    });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("has products") || error.message.includes("has models")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}