"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListProducts = handleListProducts;
exports.handleGetProductById = handleGetProductById;
exports.handleGetProductBySlug = handleGetProductBySlug;
exports.handleCreateProduct = handleCreateProduct;
exports.handleUpdateProduct = handleUpdateProduct;
exports.handleDeleteProduct = handleDeleteProduct;
const productService_1 = require("../services/productService");
const client_1 = require("@prisma/client");
async function handleListProducts(req, res, next) {
    try {
        const filters = {
            make: normalizeFilterValue(req.query.make),
            model: normalizeFilterValue(req.query.model),
            side: normalizeFilterValue(req.query.side),
            category: normalizeCategoryValue(req.query.category),
            year: parseYearValue(req.query.year),
        };
        const products = await (0, productService_1.listProducts)(filters);
        res.json(products);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetProductById(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid product id" });
        }
        const product = await (0, productService_1.getProductById)(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetProductBySlug(req, res, next) {
    try {
        const { slug } = req.params;
        if (!slug?.trim()) {
            return res.status(400).json({ message: "Slug is required" });
        }
        const product = await (0, productService_1.getProductBySlug)(slug);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    }
    catch (error) {
        next(error);
    }
}
async function handleCreateProduct(req, res, next) {
    try {
        const productData = parseProductData(req);
        validateProductData(productData, res);
        if (res.headersSent)
            return;
        const product = await (0, productService_1.createProduct)(productData);
        res.status(201).json(product);
    }
    catch (error) {
        next(error);
    }
}
async function handleUpdateProduct(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid product id" });
        }
        const productData = parseProductData(req);
        validateProductData(productData, res);
        if (res.headersSent)
            return;
        res.json(await (0, productService_1.updateProduct)(id, productData));
    }
    catch (error) {
        next(error);
    }
}
async function handleDeleteProduct(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid product id" });
        }
        await (0, productService_1.deleteProduct)(id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
function validateProductData(productData, res) {
    if (!productData.name?.trim()) {
        res.status(400).json({ message: "Product name is required" });
    }
    else if (!Number.isFinite(productData.price) || productData.price <= 0) {
        res.status(400).json({ message: "Valid price is required" });
    }
    else if (![productData.categoryId, productData.brandId, productData.modelId].every(Number.isInteger)) {
        res.status(400).json({ message: "Category, brand, and model are required" });
    }
}
function parseProductData(req) {
    const body = req.body ?? {};
    const files = req.files ?? [];
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
        availabilityStatus: body.availabilityStatus === client_1.AvailabilityStatus.SOLD_OUT
            ? client_1.AvailabilityStatus.SOLD_OUT
            : client_1.AvailabilityStatus.AVAILABLE,
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
function optionalString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function optionalNumber(value) {
    if (value === "" || value === null || value === undefined)
        return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}
function toArray(value) {
    if (Array.isArray(value))
        return value.filter((item) => typeof item === "string" && !!item.trim());
    return typeof value === "string" && value.trim() ? [value.trim()] : [];
}
function parseSide(value) {
    const normalized = String(value ?? "UNIVERSAL").toUpperCase();
    return Object.values(client_1.Side).includes(normalized) ? normalized : client_1.Side.UNIVERSAL;
}
function extractQueryString(value) {
    if (!value)
        return undefined;
    if (Array.isArray(value)) {
        return extractQueryString(value[0]);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
    }
    return undefined;
}
function normalizeFilterValue(value) {
    const parsed = extractQueryString(value);
    if (!parsed)
        return undefined;
    return parsed.toLowerCase() === "all" ? undefined : parsed;
}
function normalizeCategoryValue(value) {
    const parsed = normalizeFilterValue(value);
    if (!parsed)
        return undefined;
    const normalized = parsed.toLowerCase();
    if (normalized === "spare parts")
        return "Spare Parts";
    if (normalized === "accessories")
        return "Accessories";
    return undefined;
}
function parseYearValue(value) {
    const parsed = extractQueryString(value);
    if (!parsed)
        return undefined;
    const year = Number(parsed);
    return Number.isFinite(year) ? year : undefined;
}
