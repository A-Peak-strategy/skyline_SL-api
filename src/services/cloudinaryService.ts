import { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinaryClient } from "../config/cloudinary";

export interface StoredProductImage {
  url: string;
  publicId: string;
  assetId: string;
}

const productFolder = process.env.CLOUDINARY_PRODUCT_FOLDER?.trim() || "skyline-sl/products";

export function uploadProductImage(file: Express.Multer.File): Promise<StoredProductImage> {
  validateImageSignature(file);

  const options: UploadApiOptions = {
    resource_type: "image",
    folder: productFolder,
    overwrite: false,
    unique_filename: true,
    use_filename: false,
    tags: ["skyline-sl", "product"],
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinaryClient.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned no upload result"));
      resolve(mapUploadResult(result));
    });

    stream.on("error", reject);
    stream.end(file.buffer);
  });
}

export async function uploadProductImages(
  files: Express.Multer.File[]
): Promise<StoredProductImage[]> {
  const uploaded: StoredProductImage[] = [];
  try {
    // Sequential uploads keep memory and outbound concurrency bounded per request.
    for (const file of files) uploaded.push(await uploadProductImage(file));
    return uploaded;
  } catch (error) {
    await deleteProductImages(uploaded.map((image) => image.publicId));
    throw error;
  }
}

export async function uploadProductImageFromUrl(url: string): Promise<StoredProductImage> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error("Image URL is invalid"), { status: 400 });
  }
  if (parsed.protocol !== "https:") {
    throw Object.assign(new Error("Image URL must use HTTPS"), { status: 400 });
  }

  const result = await cloudinaryClient.uploader.upload(url, {
    resource_type: "image",
    folder: productFolder,
    overwrite: false,
    unique_filename: true,
    use_filename: false,
    tags: ["skyline-sl", "product"],
  });
  return mapUploadResult(result);
}

export async function deleteProductImages(publicIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(publicIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const results = await Promise.allSettled(
    uniqueIds.map((publicId) =>
      cloudinaryClient.uploader.destroy(publicId, { resource_type: "image", invalidate: true })
    )
  );
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    throw new Error(`Failed to delete ${failures.length} Cloudinary image(s)`);
  }
}

function mapUploadResult(result: UploadApiResponse): StoredProductImage {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    assetId: result.asset_id,
  };
}

function validateImageSignature(file: Express.Multer.File): void {
  const bytes = file.buffer;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isGif = bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"));
  const isWebp =
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    throw Object.assign(new Error(`Invalid image content: ${file.originalname}`), { status: 400 });
  }
}
