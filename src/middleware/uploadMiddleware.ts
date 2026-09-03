import fs from "fs";
import path from "path";
import multer from "multer";

export const uploadsDirectory = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(Object.assign(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), { status: 400 }));
  },
}).array("images", 8);
