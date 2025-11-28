"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProductById = getProductById;
exports.getProductBySlug = getProductBySlug;
exports.createProduct = createProduct;
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
    // Generate slug if not provided
    const slug = productData.slug || generateSlug(productData.name);
    // Create the product with nested relations
    const product = await prismaClient_1.prisma.product.create({
        data: {
            ...productData,
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
        image: primaryImage,
        description: product.description,
        compatibility,
        offer: product.offerTag ?? null,
        brand: product.brand.name,
        type: product.category.name,
        condition: product.condition ?? "New",
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
