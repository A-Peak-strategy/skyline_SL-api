import { ProductType, Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

export interface CreateCategoryData {
  name: string;
  type: ProductType;
  slug?: string;
}

export interface UpdateCategoryData {
  name?: string;
  type?: ProductType;
  slug?: string;
}

export interface FrontendCategory {
  id: number;
  name: string;
  slug: string;
  type: ProductType;
  productCount: number;
//   createdAt: Date;
//   updatedAt: Date;
}

const CATEGORY_INCLUDE = {
  _count: {
    select: {
      products: true,
    },
  },
} satisfies Prisma.CategoryInclude;

type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: typeof CATEGORY_INCLUDE;
}>;

export async function createCategory(data: CreateCategoryData): Promise<FrontendCategory> {
  try {
    const { name, type, slug } = data;

    // Generate slug if not provided
    const categorySlug = slug || generateSlug(name);

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
        //   { name: { equals: name, mode: 'insensitive' } },
          { name: { equals: name } },
          { slug: categorySlug }
        ]
      }
    });

    if (existingCategory) {
      throw new Error(`Category with name "${name}" or slug "${categorySlug}" already exists`);
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: categorySlug,
        type,
      },
      include: CATEGORY_INCLUDE,
    });

    console.log(`Category created successfully: ${category.id}`);
    return mapDbCategoryToFrontend(category);

  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

export async function getCategories(): Promise<FrontendCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      include: CATEGORY_INCLUDE,
      orderBy: { name: 'asc' },
    });

    return categories.map(mapDbCategoryToFrontend);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function getCategoryById(id: number): Promise<FrontendCategory | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: CATEGORY_INCLUDE,
    });

    if (!category) {
      return null;
    }

    return mapDbCategoryToFrontend(category);
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
}

export async function getCategoryBySlug(slug: string): Promise<FrontendCategory | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: CATEGORY_INCLUDE,
    });

    if (!category) {
      return null;
    }

    return mapDbCategoryToFrontend(category);
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    throw error;
  }
}

export async function updateCategory(
  id: number, 
  data: UpdateCategoryData
): Promise<FrontendCategory> {
  try {
    // Verify category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Check for duplicate name/slug if updating those fields
    if (data.name || data.slug) {
      const nameToCheck = data.name?.trim() || existingCategory.name;
      const slugToCheck = data.slug || generateSlug(nameToCheck);

      const duplicateCategory = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                // { name: { equals: nameToCheck, mode: 'insensitive' } },
                { name: { equals: nameToCheck } },
                { slug: slugToCheck }
              ]
            }
          ]
        }
      });

      if (duplicateCategory) {
        throw new Error(`Category with name "${nameToCheck}" or slug "${slugToCheck}" already exists`);
      }
    }

    const updateData: any = { ...data };
    
    // Generate new slug if name is updated but slug is not explicitly provided
    if (data.name && !data.slug) {
      updateData.slug = generateSlug(data.name);
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: CATEGORY_INCLUDE,
    });

    console.log(`Category ${id} updated successfully`);
    return mapDbCategoryToFrontend(category);
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
}

export async function deleteCategory(id: number): Promise<void> {
  try {
    // Verify category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existingCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      throw new Error(`Cannot delete category "${existingCategory.name}" because it has ${existingCategory._count.products} products associated with it`);
    }

    await prisma.category.delete({
      where: { id },
    });

    console.log(`Category ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
}

function mapDbCategoryToFrontend(category: CategoryWithCount): FrontendCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: category.type,
    productCount: category._count.products,
    // createdAt: category.createdAt,
    // updatedAt: category.updatedAt,
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