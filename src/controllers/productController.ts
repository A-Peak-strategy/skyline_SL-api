import { NextFunction, Request, Response } from "express";
import {
  getProductById,
  getProductBySlug,
  listProducts,
  ProductFilters,
  createProduct,
  CreateProductData,
} from "../services/productService";

export async function handleListProducts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters: ProductFilters = {
      make: normalizeFilterValue(req.query.make),
      model: normalizeFilterValue(req.query.model),
      side: normalizeFilterValue(req.query.side),
      category: normalizeCategoryValue(req.query.category),
      year: parseYearValue(req.query.year),
    };

    const products = await listProducts(filters);
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function handleGetProductById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleGetProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { slug } = req.params;
    if (!slug?.trim()) {
      return res.status(400).json({ message: "Slug is required" });
    }

    const product = await getProductBySlug(slug);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateProduct(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const productData: CreateProductData = req.body;
    // Basic validation
    if (!productData.name || !productData.name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (!productData.price || productData.price <= 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const product = await createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

function extractQueryString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return extractQueryString(value[0]);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
}

function normalizeFilterValue(value: unknown): string | undefined {
  const parsed = extractQueryString(value);
  if (!parsed) return undefined;

  return parsed.toLowerCase() === "all" ? undefined : parsed;
}

function normalizeCategoryValue(value: unknown): ProductFilters["category"] {
  const parsed = normalizeFilterValue(value);
  if (!parsed) return undefined;

  const normalized = parsed.toLowerCase();
  if (normalized === "spare parts") return "Spare Parts";
  if (normalized === "accessories") return "Accessories";
  return undefined;
}

function parseYearValue(value: unknown): number | undefined {
  const parsed = extractQueryString(value);
  if (!parsed) return undefined;

  const year = Number(parsed);
  return Number.isFinite(year) ? year : undefined;
}
