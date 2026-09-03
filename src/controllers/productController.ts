import { NextFunction, Request, Response } from "express";
import {
  getProductById,
  getProductBySlug,
  listProducts,
  ProductFilters,
  createProduct,
  CreateProductData,
  updateProduct,
  deleteProduct,
} from "../services/productService";
import { AvailabilityStatus, Side } from "@prisma/client";

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
    const productData = parseProductData(req);
    validateProductData(productData, res);
    if (res.headersSent) return;

    const product = await createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const productData = parseProductData(req);
    validateProductData(productData, res);
    if (res.headersSent) return;
    res.json(await updateProduct(id, productData));
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    await deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function validateProductData(productData: CreateProductData, res: Response): void {
  if (!productData.name?.trim()) {
    res.status(400).json({ message: "Product name is required" });
  } else if (!Number.isFinite(productData.price) || productData.price <= 0) {
    res.status(400).json({ message: "Valid price is required" });
  } else if (![productData.categoryId, productData.brandId, productData.modelId].every(Number.isInteger)) {
    res.status(400).json({ message: "Category, brand, and model are required" });
  }
}

function parseProductData(req: Request): CreateProductData {
  const body = req.body ?? {};
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const existingImages = [...toArray(body.existingImages), ...toArray(body.image)];
  const uploadedImages = files.map((file) => `/uploads/${file.filename}`);
  const side = parseSide(body.side);
  const yearFrom = optionalNumber(body.yearFrom ?? body.year ?? body.mainYear);
  const yearTo = optionalNumber(body.yearTo) ?? yearFrom;

  return {
    name: String(body.name ?? "").trim(),
    description: String(body.description ?? "").trim(),
    price: Number(body.price),
    originalPrice: optionalNumber(body.originalPrice),
    categoryId: Number(body.categoryId),
    brandId: Number(body.brandId),
    modelId: Number(body.modelId),
    condition: optionalString(body.condition),
    offerTag: optionalString(body.offerTag ?? body.badge),
    slug: optionalString(body.slug),
    mainYear: optionalNumber(body.mainYear ?? body.year),
    availabilityStatus:
      body.availabilityStatus === AvailabilityStatus.SOLD_OUT
        ? AvailabilityStatus.SOLD_OUT
        : AvailabilityStatus.AVAILABLE,
    image: existingImages[0] ?? uploadedImages[0],
    fitments: yearFrom
      ? [{ side, yearFrom, yearTo: yearTo ?? yearFrom }]
      : [],
    images: [...existingImages, ...uploadedImages].map((url, index) => ({
      url,
      isPrimary: index === 0,
    })),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && !!item.trim());
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function parseSide(value: unknown): Side {
  const normalized = String(value ?? "UNIVERSAL").toUpperCase();
  return Object.values(Side).includes(normalized as Side) ? (normalized as Side) : Side.UNIVERSAL;
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
