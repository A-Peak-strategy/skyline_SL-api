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
const cloudinaryService_1 = require("../services/cloudinaryService");
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
        const uploadedImages = await uploadRequestedImages(req);
        try {
            productData.images = toProductImages(uploadedImages);
            productData.image = productData.images[0]?.url;
            const product = await (0, productService_1.createProduct)(productData);
            res.status(201).json(product);
        }
        catch (error) {
            await cleanupNewUploads(uploadedImages);
            throw error;
        }
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
        const uploadedImages = await uploadRequestedImages(req);
        try {
            productData.images = toProductImages(uploadedImages);
            const { product, removedPublicIds } = await (0, productService_1.updateProduct)(id, productData);
            try {
                await (0, cloudinaryService_1.deleteProductImages)(removedPublicIds);
            }
            catch (cleanupError) {
                console.error("Cloudinary cleanup failed after product update", cleanupError);
            }
            res.json(product);
        }
        catch (error) {
            await cleanupNewUploads(uploadedImages);
            throw error;
        }
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
        const publicIds = await (0, productService_1.deleteProduct)(id);
        try {
            await (0, cloudinaryService_1.deleteProductImages)(publicIds);
        }
        catch (cleanupError) {
            // The database deletion has committed. Log for operational retry instead of
            // returning an error that could make the client repeat the product deletion.
            console.error("Cloudinary cleanup failed after product deletion", cleanupError);
        }
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
        retainedImageIds: toArray(body.retainedImageIds)
            .map(Number)
            .filter((id) => Number.isInteger(id) && id > 0),
        fitments: yearFrom
            ? [{ side, yearFrom, yearTo: yearTo ?? yearFrom }]
            : [],
    };
}
async function uploadRequestedImages(req) {
    const files = req.files ?? [];
    const remoteUrls = [...toArray(req.body?.imageUrls), ...toArray(req.body?.image)];
    if (files.length + remoteUrls.length > 5) {
        throw Object.assign(new Error("Maximum 5 images allowed per product"), { status: 400 });
    }
    const uploaded = [];
    try {
        for (const file of files)
            uploaded.push(await (0, cloudinaryService_1.uploadProductImage)(file));
        for (const url of remoteUrls)
            uploaded.push(await (0, cloudinaryService_1.uploadProductImageFromUrl)(url));
        return uploaded;
    }
    catch (error) {
        await cleanupNewUploads(uploaded);
        throw error;
    }
}
function toProductImages(images) {
    return images.map((image, index) => ({
        url: image.url,
        publicId: image.publicId,
        assetId: image.assetId,
        isPrimary: index === 0,
    }));
}
async function cleanupNewUploads(images) {
    try {
        await (0, cloudinaryService_1.deleteProductImages)(images.map((image) => image.publicId));
    }
    catch (cleanupError) {
        console.error("Failed to roll back newly uploaded Cloudinary images", cleanupError);
    }
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
