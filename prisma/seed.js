"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const toyota = await prisma.brand.create({
        data: { name: "Toyota", slug: "toyota" },
    });
    const camry = await prisma.vehicleModel.create({
        data: { name: "Camry", slug: "camry", brandId: toyota.id },
    });
    const spareCategory = await prisma.category.create({
        data: {
            name: "Spare Parts",
            slug: "spare-parts",
            type: "SPARE_PART",
        },
    });
    const accessoryCategory = await prisma.category.create({
        data: {
            name: "Accessories",
            slug: "accessories",
            type: "ACCESSORY",
        },
    });
    const headlight = await prisma.product.create({
        data: {
            slug: "led-headlight-assembly-toyota-camry-2020-left",
            name: "LED Headlight Assembly",
            description: "Premium LED headlight assembly with auto-leveling and dynamic beam pattern.",
            price: 15000,
            originalPrice: 18000,
            type: "SPARE_PART",
            availabilityStatus: "AVAILABLE",
            offerTag: "20% OFF",
            condition: "New",
            image: "car headlight",
            mainYear: 2020,
            brandId: toyota.id,
            modelId: camry.id,
            categoryId: spareCategory.id,
            fitments: {
                create: {
                    yearFrom: 2020,
                    yearTo: 2023,
                    side: "LEFT",
                    compatibilityNotes: "Compatible with Toyota Camry 2020-2023 models.",
                },
            },
        },
    });
    const audio = await prisma.product.create({
        data: {
            slug: "universal-touchscreen-audio-system",
            name: "Universal Touchscreen Audio System",
            description: "Modern touchscreen audio system with Bluetooth and Apple CarPlay/Android Auto.",
            price: 45000,
            originalPrice: 52000,
            type: "ACCESSORY",
            availabilityStatus: "AVAILABLE",
            offerTag: "Best Seller",
            condition: "New",
            image: "car audio",
            mainYear: 2022,
            brandId: toyota.id,
            modelId: camry.id,
            categoryId: accessoryCategory.id,
            fitments: {
                create: {
                    yearFrom: 2005,
                    yearTo: 2025,
                    side: "UNIVERSAL",
                    compatibilityNotes: "Universal fit for most vehicles with 2-DIN slot.",
                },
            },
        },
    });
    console.log("Seed complete:", { headlight, audio });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
