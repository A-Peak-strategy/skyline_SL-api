"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListProducts = handleListProducts;
exports.handleGetProductById = handleGetProductById;
exports.handleGetProductBySlug = handleGetProductBySlug;
const productService_1 = require("../services/productService");
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
