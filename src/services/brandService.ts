import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

export interface CreateBrandData {
  name: string;
  slug?: string;
}

export interface UpdateBrandData {
  name?: string;
  slug?: string;
}

export interface FrontendBrand {
  id: number;
  name: string;
  slug: string;
  modelCount: number;
  productCount: number;
//   createdAt: Date;
//   updatedAt: Date;
}

const BRAND_INCLUDE = {
  include: {
    _count: {
      select: {
        products: true,
        models: true,
      },
    },
  },
};

type BrandWithCount = Prisma.BrandGetPayload<typeof BRAND_INCLUDE>;

export async function createBrand(data: CreateBrandData): Promise<FrontendBrand> {
  try {
    const { name, slug } = data;

    // Generate slug if not provided
    const brandSlug = slug || generateSlug(name);

    // Check if brand with same name or slug already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: brandSlug }
        ]
      }
    });

    if (existingBrand) {
      throw new Error(`Brand with name "${name}" or slug "${brandSlug}" already exists`);
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug: brandSlug,
      },
      ...BRAND_INCLUDE,
    });

    console.log(`Brand created successfully: ${brand.id}`);
    return mapDbBrandToFrontend(brand);

  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
}

export async function getBrands(): Promise<FrontendBrand[]> {
  try {
    const brands = await prisma.brand.findMany({
      ...BRAND_INCLUDE,
      orderBy: { name: 'asc' },
    });

    return brands.map(mapDbBrandToFrontend);
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
}

export async function getBrandById(id: number): Promise<FrontendBrand | null> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
      ...BRAND_INCLUDE,
    });

    if (!brand) {
      return null;
    }

    return mapDbBrandToFrontend(brand);
  } catch (error) {
    console.error(`Error fetching brand ${id}:`, error);
    throw error;
  }
}

export async function getBrandBySlug(slug: string): Promise<FrontendBrand | null> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug },
      ...BRAND_INCLUDE,
    });

    if (!brand) {
      return null;
    }

    return mapDbBrandToFrontend(brand);
  } catch (error) {
    console.error(`Error fetching brand by slug ${slug}:`, error);
    throw error;
  }
}

export async function updateBrand(
  id: number, 
  data: UpdateBrandData
): Promise<FrontendBrand> {
  try {
    // Verify brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      throw new Error(`Brand with ID ${id} not found`);
    }

    // Check for duplicate name/slug if updating those fields
    if (data.name || data.slug) {
      const nameToCheck = data.name?.trim() || existingBrand.name;
      const slugToCheck = data.slug || generateSlug(nameToCheck);

      const duplicateBrand = await prisma.brand.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { name: nameToCheck },
                { slug: slugToCheck }
              ]
            }
          ]
        }
      });

      if (duplicateBrand) {
        throw new Error(`Brand with name "${nameToCheck}" or slug "${slugToCheck}" already exists`);
      }
    }

    const updateData: any = { ...data };
    
    // Generate new slug if name is updated but slug is not explicitly provided
    if (data.name && !data.slug) {
      updateData.slug = generateSlug(data.name);
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
      ...BRAND_INCLUDE,
    });

    console.log(`Brand ${id} updated successfully`);
    return mapDbBrandToFrontend(brand);
  } catch (error) {
    console.error(`Error updating brand ${id}:`, error);
    throw error;
  }
}

export async function deleteBrand(id: number): Promise<void> {
  try {
    // Verify brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            products: true,
            models: true
          }
        }
      }
    });

    if (!existingBrand) {
      throw new Error(`Brand with ID ${id} not found`);
    }

    // Check if brand has products or models
    if (existingBrand._count.products > 0) {
      throw new Error(`Cannot delete brand "${existingBrand.name}" because it has ${existingBrand._count.products} products associated with it`);
    }

    if (existingBrand._count.models > 0) {
      throw new Error(`Cannot delete brand "${existingBrand.name}" because it has ${existingBrand._count.models} models associated with it`);
    }

    await prisma.brand.delete({
      where: { id },
    });

    console.log(`Brand ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting brand ${id}:`, error);
    throw error;
  }
}

function mapDbBrandToFrontend(brand: BrandWithCount): FrontendBrand {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    modelCount: brand._count.models,
    productCount: brand._count.products,
    // createdAt: brand.createdAt,
    // updatedAt: brand.updatedAt,
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}