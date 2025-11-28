import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

export interface CreateVehicleModelData {
  name: string;
  brandId: number;
  slug?: string;
}

export interface UpdateVehicleModelData {
  name?: string;
  brandId?: number;
  slug?: string;
}

export interface FrontendVehicleModel {
  id: number;
  name: string;
  slug: string;
  brandId: number;
  brandName: string;
  productCount: number;
//   createdAt: Date;
//   updatedAt: Date;
}

const VEHICLE_MODEL_INCLUDE = {
  include: {
    brand: {
      select: {
        id: true,
        name: true,
      },
    },
    _count: {
      select: {
        products: true,
      },
    },
  },
};

type VehicleModelWithRelations = Prisma.VehicleModelGetPayload<typeof VEHICLE_MODEL_INCLUDE>;

export async function createVehicleModel(data: CreateVehicleModelData): Promise<FrontendVehicleModel> {
  try {
    const { name, brandId, slug } = data;

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new Error(`Brand with ID ${brandId} not found`);
    }

    // Generate slug if not provided
    const modelSlug = slug || generateSlug(name);

    // Check if model with same name or slug already exists for this brand
    const existingModel = await prisma.vehicleModel.findFirst({
      where: {
        AND: [
          { brandId },
          {
            OR: [
              { name: name },
              { slug: modelSlug }
            ]
          }
        ]
      }
    });

    if (existingModel) {
      throw new Error(`Vehicle model with name "${name}" or slug "${modelSlug}" already exists for this brand`);
    }

    const vehicleModel = await prisma.vehicleModel.create({
      data: {
        name: name.trim(),
        slug: modelSlug,
        brandId,
      },
      ...VEHICLE_MODEL_INCLUDE,
    });

    console.log(`Vehicle model created successfully: ${vehicleModel.id}`);
    return mapDbVehicleModelToFrontend(vehicleModel);

  } catch (error) {
    console.error('Error creating vehicle model:', error);
    throw error;
  }
}

export async function getVehicleModels(): Promise<FrontendVehicleModel[]> {
  try {
    const vehicleModels = await prisma.vehicleModel.findMany({
      ...VEHICLE_MODEL_INCLUDE,
      orderBy: { name: 'asc' },
    });

    return vehicleModels.map(mapDbVehicleModelToFrontend);
  } catch (error) {
    console.error('Error fetching vehicle models:', error);
    throw error;
  }
}

export async function getVehicleModelsByBrand(brandId: number): Promise<FrontendVehicleModel[]> {
  try {
    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new Error(`Brand with ID ${brandId} not found`);
    }

    const vehicleModels = await prisma.vehicleModel.findMany({
      where: { brandId },
      ...VEHICLE_MODEL_INCLUDE,
      orderBy: { name: 'asc' },
    });

    return vehicleModels.map(mapDbVehicleModelToFrontend);
  } catch (error) {
    console.error(`Error fetching vehicle models for brand ${brandId}:`, error);
    throw error;
  }
}

export async function getVehicleModelById(id: number): Promise<FrontendVehicleModel | null> {
  try {
    const vehicleModel = await prisma.vehicleModel.findUnique({
      where: { id },
      ...VEHICLE_MODEL_INCLUDE,
    });

    if (!vehicleModel) {
      return null;
    }

    return mapDbVehicleModelToFrontend(vehicleModel);
  } catch (error) {
    console.error(`Error fetching vehicle model ${id}:`, error);
    throw error;
  }
}

// export async function getVehicleModelBySlug(slug: string): Promise<FrontendVehicleModel | null> {
//   try {
//     const vehicleModel = await prisma.vehicleModel.findUnique({
//       where: { slug },
//       ...VEHICLE_MODEL_INCLUDE,
//     });

//     if (!vehicleModel) {
//       return null;
//     }

//     return mapDbVehicleModelToFrontend(vehicleModel);
//   } catch (error) {
//     console.error(`Error fetching vehicle model by slug ${slug}:`, error);
//     throw error;
//   }
// }

export async function updateVehicleModel(
  id: number, 
  data: UpdateVehicleModelData
): Promise<FrontendVehicleModel> {
  try {
    // Verify vehicle model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id },
    });

    if (!existingModel) {
      throw new Error(`Vehicle model with ID ${id} not found`);
    }

    // Verify brand exists if updating brandId
    if (data.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId },
      });

      if (!brand) {
        throw new Error(`Brand with ID ${data.brandId} not found`);
      }
    }

    // Check for duplicate name/slug if updating those fields
    if (data.name || data.slug) {
      const nameToCheck = data.name?.trim() || existingModel.name;
      const slugToCheck = data.slug || generateSlug(nameToCheck);
      const brandIdToCheck = data.brandId || existingModel.brandId;

      const duplicateModel = await prisma.vehicleModel.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { brandId: brandIdToCheck },
            {
              OR: [
                { name: nameToCheck },
                { slug: slugToCheck }
              ]
            }
          ]
        }
      });

      if (duplicateModel) {
        throw new Error(`Vehicle model with name "${nameToCheck}" or slug "${slugToCheck}" already exists for this brand`);
      }
    }

    const updateData: any = { ...data };
    
    // Generate new slug if name is updated but slug is not explicitly provided
    if (data.name && !data.slug) {
      updateData.slug = generateSlug(data.name);
    }

    const vehicleModel = await prisma.vehicleModel.update({
      where: { id },
      data: updateData,
      ...VEHICLE_MODEL_INCLUDE,
    });

    console.log(`Vehicle model ${id} updated successfully`);
    return mapDbVehicleModelToFrontend(vehicleModel);
  } catch (error) {
    console.error(`Error updating vehicle model ${id}:`, error);
    throw error;
  }
}

export async function deleteVehicleModel(id: number): Promise<void> {
  try {
    // Verify vehicle model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            products: true
          }
        }
      }
    });

    if (!existingModel) {
      throw new Error(`Vehicle model with ID ${id} not found`);
    }

    // Check if model has products
    if (existingModel._count.products > 0) {
      throw new Error(`Cannot delete vehicle model "${existingModel.name}" because it has ${existingModel._count.products} products associated with it`);
    }

    await prisma.vehicleModel.delete({
      where: { id },
    });

    console.log(`Vehicle model ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting vehicle model ${id}:`, error);
    throw error;
  }
}

function mapDbVehicleModelToFrontend(vehicleModel: VehicleModelWithRelations): FrontendVehicleModel {
  return {
    id: vehicleModel.id,
    name: vehicleModel.name,
    slug: vehicleModel.slug,
    brandId: vehicleModel.brandId,
    brandName: vehicleModel.brand.name,
    productCount: vehicleModel._count.products,
    // createdAt: vehicleModel.createdAt,
    // updatedAt: vehicleModel.updatedAt,
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