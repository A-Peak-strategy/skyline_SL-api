import { NextFunction, Request, Response } from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  CreateCategoryData,
  UpdateCategoryData
} from "../services/categoryService";

export async function handleCreateCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categoryData: CreateCategoryData = req.body;

    // Validation
    if (!categoryData.name || !categoryData.name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (!categoryData.type) {
      return res.status(400).json({ message: "Category type is required" });
    }

    const category = await createCategory(categoryData);
    res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
}

export async function handleGetCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await getCategories();
    res.json({
      message: "Categories retrieved successfully",
      categories,
      count: categories.length
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetCategoryById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category retrieved successfully",
      category
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    const categoryData: UpdateCategoryData = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    if (categoryData.name && !categoryData.name.trim()) {
      return res.status(400).json({ message: "Category name cannot be empty" });
    }

    const category = await updateCategory(id, categoryData);
    res.json({
      message: "Category updated successfully",
      category
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

export async function handleDeleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    await deleteCategory(id);
    res.json({
      message: "Category deleted successfully"
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