require("dotenv").config();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const apiBase = process.env.SMOKE_API_URL || `http://localhost:${process.env.PORT || 4000}`;
let createdProductId;

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} returned ${response.status}: ${text}`);
  return body;
}

async function main() {
  const [admin, category, model] = await Promise.all([
    prisma.user.findFirst({ where: { role: "ADMIN" } }),
    prisma.category.findFirst(),
    prisma.vehicleModel.findFirst(),
  ]);
  if (!admin || !category || !model) {
    throw new Error("Smoke test requires one admin, category, brand, and vehicle model in the database");
  }

  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET || "development-only-change-me",
    { expiresIn: "5m" }
  );
  const authorization = { Authorization: `Bearer ${token}` };
  const form = new FormData();
  form.append("name", `Smoke Test Product ${Date.now()}`);
  form.append("description", "Temporary product created by the API smoke test");
  form.append("price", "1000");
  form.append("categoryId", String(category.id));
  form.append("brandId", String(model.brandId));
  form.append("modelId", String(model.id));
  form.append("mainYear", "2024");
  form.append("side", "LEFT");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  form.append("images", new Blob([png], { type: "image/png" }), "smoke.png");

  const created = await request("/api/products", { method: "POST", headers: authorization, body: form });
  createdProductId = Number(created.id);
  if (!createdProductId || created.name !== form.get("name")) throw new Error("Product create contract failed");

  const update = new FormData();
  update.append("name", `${created.name} Updated`);
  update.append("description", created.description);
  update.append("price", "1200");
  update.append("categoryId", String(category.id));
  update.append("brandId", String(model.brandId));
  update.append("modelId", String(model.id));
  update.append("retainedImageIds", String(created.images[0].id));
  const updated = await request(`/api/products/${createdProductId}`, {
    method: "PUT",
    headers: authorization,
    body: update,
  });
  if (updated.price !== 1200) throw new Error("Product update contract failed");

  await request(`/api/products/${createdProductId}`, { method: "DELETE", headers: authorization });
  createdProductId = undefined;
  console.log("API smoke test passed: product multipart create, update, and delete");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (createdProductId) {
      await prisma.productImage.deleteMany({ where: { productId: createdProductId } });
      await prisma.productFitment.deleteMany({ where: { productId: createdProductId } });
      await prisma.product.deleteMany({ where: { id: createdProductId } });
    }
    await prisma.$disconnect();
  });
