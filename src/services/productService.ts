import { AvailabilityStatus, Prisma, ProductType, Side } from "@prisma/client";
import { prisma } from "../prismaClient";

export interface ProductFilters {
  make?: string;
  model?: string;
  year?: number;
  side?: string;
  category?: "Spare Parts" | "Accessories";
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  type: ProductType;
  categoryId: number;
  brandId: number;
  modelId: number;
  condition?: string;
  offerTag?: string;
  slug?: string;
  mainYear?: number;
  availabilityStatus?: AvailabilityStatus;
  image?: string;
  // Fitment data
  fitments?: {
    side: Side;
    yearFrom: number;
    yearTo: number;
    compatibilityNotes?: string;
  }[];
  // Image data
  images?: {
    url: string;
    isPrimary?: boolean;
  }[];
}

export interface FrontendProduct {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  side: string;
  category: "Spare Parts" | "Accessories";
  price: number;
  originalPrice: number | null;
  availability: "Available" | "Sold Out";
  image: string;
  description: string;
  compatibility: string[];
  offer: string | null;
  brand?: string;
  type?: string;
  condition?: string;
}

const PRODUCT_INCLUDE = {
  brand: true,
  model: true,
  category: true,
  fitments: {
    orderBy: {
      yearFrom: "asc" as const,
    },
  },
  images: {
    orderBy: [
      { isPrimary: "desc" as const },
      { id: "asc" as const },
    ],
  },
} satisfies Prisma.ProductInclude;

const CATEGORY_LABELS: Record<ProductType, "Spare Parts" | "Accessories"> = {
  SPARE_PART: "Spare Parts",
  ACCESSORY: "Accessories",
};

const SIDE_LABELS: Record<Side, string> = {
  LEFT: "Left",
  RIGHT: "Right",
  PAIR: "Pair",
  UNIVERSAL: "Universal",
  FRONT: "Front",
  REAR: "Rear",
};

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=Auto+Part";

export async function listProducts(
  filters: ProductFilters = {}
): Promise<FrontendProduct[]> {
  const { make, model, year, side, category } = filters;

  const conditions: Prisma.ProductWhereInput[] = [];

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

  const where =
    conditions.length > 0
      ? ({
          AND: conditions,
        } satisfies Prisma.ProductWhereInput)
      : undefined;

  const products = await prisma.product.findMany({
    where,
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return products.map(mapDbProductToFrontend);
}

export async function getProductById(
  id: number
): Promise<FrontendProduct | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    return null;
  }

  return mapDbProductToFrontend(product);
}

export async function getProductBySlug(
  slug: string
): Promise<FrontendProduct | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    return null;
  }

  return mapDbProductToFrontend(product);
}

export async function createProduct(
  data: CreateProductData
): Promise<FrontendProduct> {
  const {
    fitments = [],
    images = [],
    availabilityStatus = AvailabilityStatus.AVAILABLE, // Default value
    ...productData
  } = data;

  // Generate slug if not provided
  const slug = productData.slug || generateSlug(productData.name);

  // Create the product with nested relations
  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      availabilityStatus, // Now this is guaranteed to have a value
      price: new Prisma.Decimal(productData.price),
      originalPrice: productData.originalPrice 
        ? new Prisma.Decimal(productData.originalPrice)
        : null,
      // Create relations
      fitments: {
        create: fitments.length > 0 ? fitments : [
          {
            side: Side.UNIVERSAL,
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
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapDbProductToFrontend(product: ProductWithRelations): FrontendProduct {
  const primaryFitment = product.fitments[0];
  const representativeYear =
    product.mainYear ??
    primaryFitment?.yearFrom ??
    primaryFitment?.yearTo ??
    new Date().getFullYear();

  const sideLabel = SIDE_LABELS[primaryFitment?.side ?? Side.UNIVERSAL];

  const compatibility =
    product.fitments.length > 0
      ? product.fitments.map((fitment) => {
          const yearRange =
            fitment.yearFrom === fitment.yearTo
              ? `${fitment.yearFrom}`
              : `${fitment.yearFrom}-${fitment.yearTo}`;
          const notes = fitment.compatibilityNotes
            ? ` (${fitment.compatibilityNotes})`
            : "";
          return `${product.brand.name} ${product.model.name} ${yearRange}${notes}`;
        })
      : [];

  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url ??
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
    originalPrice:
      product.originalPrice !== null && product.originalPrice !== undefined
        ? Number(product.originalPrice)
        : null,
    availability:
      product.availabilityStatus === AvailabilityStatus.AVAILABLE
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

function mapCategoryLabelToType(
  label: "Spare Parts" | "Accessories"
): ProductType | undefined {
  if (label === "Spare Parts") return ProductType.SPARE_PART;
  if (label === "Accessories") return ProductType.ACCESSORY;
  return undefined;
}

function resolveSideEnum(value?: string): Side | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  const sideMap: Record<string, Side> = {
    left: Side.LEFT,
    right: Side.RIGHT,
    universal: Side.UNIVERSAL,
    pair: Side.PAIR,
    front: Side.FRONT,
    rear: Side.REAR,
  };

  return sideMap[normalized];
}
