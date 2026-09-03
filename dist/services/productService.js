"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProductById = getProductById;
exports.getProductBySlug = getProductBySlug;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const client_1 = require("@prisma/client");
const prismaClient_1 = require("../prismaClient");
const PRODUCT_INCLUDE = {
    brand: true,
    model: true,
    category: true,
    fitments: {
        orderBy: {
            yearFrom: "asc",
        },
    },
    images: {
        orderBy: [
            { isPrimary: "desc" },
            { id: "asc" },
        ],
    },
};
const CATEGORY_LABELS = {
    SPARE_PART: "Spare Parts",
    ACCESSORY: "Accessories",
};
const SIDE_LABELS = {
    LEFT: "Left",
    RIGHT: "Right",
    PAIR: "Pair",
    UNIVERSAL: "Universal",
    FRONT: "Front",
    REAR: "Rear",
};
const FALLBACK_IMAGE = "https://placehold.co/600x400?text=Auto+Part";
function resolveImageUrl(url) {
    if (!url.startsWith("/uploads/"))
        return url;
    const publicBaseUrl = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`)
        .replace(/\/$/, "");
    return `${publicBaseUrl}${url}`;
}
async function listProducts(filters = {}) {
    const { make, model, year, side, category } = filters;
    const conditions = [];
    if (category) {
        const productType = mapCategoryLabelToType(category);
        if (productType) {
            conditions.push({ type: productType });
        }
    }
    if (make) {
        conditions.push({
            brand: { name: { equals: make } },
        });
    }
    if (model) {
        conditions.push({
            model: { name: { contains: model } },
        });
    }
    const sideEnum = resolveSideEnum(side);
    if (sideEnum) {
        conditions.push({
            fitments: {
                some: {
                    side: sideEnum,
                },
            },
        });
    }
    if (typeof year === "number") {
        conditions.push({
            OR: [
                { mainYear: year },
                {
                    fitments: {
                        some: {
                            yearFrom: { lte: year },
                            yearTo: { gte: year },
                        },
                    },
                },
            ],
        });
    }
    const where = conditions.length > 0
        ? {
            AND: conditions,
        }
        : undefined;
    const products = await prismaClient_1.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: "desc" },
    });
    return products.map(mapDbProductToFrontend);
}
async function getProductById(id) {
    const product = await prismaClient_1.prisma.product.findUnique({
        where: { id },
        include: PRODUCT_INCLUDE,
    });
    if (!product) {
        return null;
    }
    return mapDbProductToFrontend(product);
}
async function getProductBySlug(slug) {
    const product = await prismaClient_1.prisma.product.findUnique({
        where: { slug },
        include: PRODUCT_INCLUDE,
    });
    if (!product) {
        return null;
    }
    return mapDbProductToFrontend(product);
}
async function createProduct(data) {
    const { fitments = [], images = [], availabilityStatus = client_1.AvailabilityStatus.AVAILABLE, // Default value
    ...productData } = data;
    const type = await validateProductRelations(productData);
    // Generate slug if not provided
    const slug = productData.slug || generateSlug(productData.name);
    // Create the product with nested relations
    const product = await prismaClient_1.prisma.product.create({
        data: {
            ...productData,
            type,
            slug,
            availabilityStatus, // Now this is guaranteed to have a value
            price: new client_1.Prisma.Decimal(productData.price),
            originalPrice: productData.originalPrice
                ? new client_1.Prisma.Decimal(productData.originalPrice)
                : null,
            // Create relations
            fitments: {
                create: fitments.length > 0 ? fitments : [
                    {
                        side: client_1.Side.UNIVERSAL,
                        yearFrom: productData.mainYear || new Date().getFullYear(),
                        yearTo: productData.mainYear || new Date().getFullYear(),
                    }
                ],
            },
            images: {
                create: images.length > 0 ? images : [
                    {
                        url: productData.image || FALLBACK_IMAGE,
                        isPrimary: true,
                    },
                ],
            },
        },
        include: PRODUCT_INCLUDE,
    });
    return mapDbProductToFrontend(product);
}
async function updateProduct(id, data) {
    const existing = await prismaClient_1.prisma.product.findUnique({ where: { id } });
    if (!existing)
        throw Object.assign(new Error("Product not found"), { status: 404 });
    const { fitments = [], images = [], availabilityStatus = existing.availabilityStatus, ...productData } = data;
    const type = await validateProductRelations(productData);
    const product = await prismaClient_1.prisma.product.update({
        where: { id },
        data: {
            ...productData,
            type,
            slug: productData.slug || generateSlug(productData.name),
            availabilityStatus,
            price: new client_1.Prisma.Decimal(productData.price),
            originalPrice: productData.originalPrice !== undefined && productData.originalPrice !== null
                ? new client_1.Prisma.Decimal(productData.originalPrice)
                : null,
            fitments: {
                deleteMany: {},
                create: fitments.length
                    ? fitments
                    : [{
                            side: client_1.Side.UNIVERSAL,
                            yearFrom: productData.mainYear || new Date().getFullYear(),
                            yearTo: productData.mainYear || new Date().getFullYear(),
                        }],
            },
            images: {
                deleteMany: {},
                create: images.length
                    ? images
                    : [{ url: productData.image || FALLBACK_IMAGE, isPrimary: true }],
            },
        },
        include: PRODUCT_INCLUDE,
    });
    return mapDbProductToFrontend(product);
}
async function deleteProduct(id) {
    const existing = await prismaClient_1.prisma.product.findUnique({
        where: { id },
        select: { id: true, _count: { select: { orders: true } } },
    });
    if (!existing)
        throw Object.assign(new Error("Product not found"), { status: 404 });
    if (existing._count.orders > 0) {
        throw Object.assign(new Error("Products with orders cannot be deleted"), { status: 409 });
    }
    await prismaClient_1.prisma.$transaction([
        prismaClient_1.prisma.productImage.deleteMany({ where: { productId: id } }),
        prismaClient_1.prisma.productFitment.deleteMany({ where: { productId: id } }),
        prismaClient_1.prisma.product.delete({ where: { id } }),
    ]);
}
async function validateProductRelations(data) {
    const [category, brand, model] = await Promise.all([
        prismaClient_1.prisma.category.findUnique({ where: { id: data.categoryId } }),
        prismaClient_1.prisma.brand.findUnique({ where: { id: data.brandId } }),
        prismaClient_1.prisma.vehicleModel.findUnique({ where: { id: data.modelId } }),
    ]);
    if (!category)
        throw Object.assign(new Error("Category not found"), { status: 400 });
    if (!brand)
        throw Object.assign(new Error("Brand not found"), { status: 400 });
    if (!model || model.brandId !== brand.id) {
        throw Object.assign(new Error("The selected model does not belong to the selected brand"), { status: 400 });
    }
    return category.type;
}
// Helper function to generate slug
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function mapDbProductToFrontend(product) {
    const primaryFitment = product.fitments[0];
    const representativeYear = product.mainYear ??
        primaryFitment?.yearFrom ??
        primaryFitment?.yearTo ??
        new Date().getFullYear();
    const sideLabel = SIDE_LABELS[primaryFitment?.side ?? client_1.Side.UNIVERSAL];
    const compatibility = product.fitments.length > 0
        ? product.fitments.map((fitment) => {
            const yearRange = fitment.yearFrom === fitment.yearTo
                ? `${fitment.yearFrom}`
                : `${fitment.yearFrom}-${fitment.yearTo}`;
            const notes = fitment.compatibilityNotes
                ? ` (${fitment.compatibilityNotes})`
                : "";
            return `${product.brand.name} ${product.model.name} ${yearRange}${notes}`;
        })
        : [];
    const primaryImage = product.images.find((img) => img.isPrimary)?.url ??
        product.images[0]?.url ??
        product.image ??
        FALLBACK_IMAGE;
    return {
        id: product.id.toString(),
        name: product.name,
        make: product.brand.name,
        model: product.model.name,
        year: representativeYear,
        side: sideLabel,
        category: CATEGORY_LABELS[product.type],
        price: Number(product.price),
        originalPrice: product.originalPrice !== null && product.originalPrice !== undefined
            ? Number(product.originalPrice)
            : null,
        availability: product.availabilityStatus === client_1.AvailabilityStatus.AVAILABLE
            ? "Available"
            : "Sold Out",
        image: resolveImageUrl(primaryImage),
        description: product.description,
        compatibility,
        offer: product.offerTag ?? null,
        brand: product.brand.name,
        type: product.category.name,
        condition: product.condition ?? "New",
        slug: product.slug,
        categoryId: product.categoryId,
        brandId: product.brandId,
        modelId: product.modelId,
        availabilityStatus: product.availabilityStatus,
        mainYear: product.mainYear,
        yearFrom: primaryFitment?.yearFrom ?? null,
        yearTo: primaryFitment?.yearTo ?? null,
        fitments: product.fitments.map((fitment) => ({
            id: fitment.id,
            side: fitment.side,
            yearFrom: fitment.yearFrom,
            yearTo: fitment.yearTo,
            compatibilityNotes: fitment.compatibilityNotes,
        })),
        images: product.images.map((image) => ({
            id: image.id,
            url: resolveImageUrl(image.url),
            isPrimary: image.isPrimary,
        })),
    };
}
function mapCategoryLabelToType(label) {
    if (label === "Spare Parts")
        return client_1.ProductType.SPARE_PART;
    if (label === "Accessories")
        return client_1.ProductType.ACCESSORY;
    return undefined;
}
function resolveSideEnum(value) {
    if (!value)
        return undefined;
    const normalized = value.toLowerCase();
    const sideMap = {
        left: client_1.Side.LEFT,
        right: client_1.Side.RIGHT,
        universal: client_1.Side.UNIVERSAL,
        pair: client_1.Side.PAIR,
        front: client_1.Side.FRONT,
        rear: client_1.Side.REAR,
    };
    return sideMap[normalized];
}
