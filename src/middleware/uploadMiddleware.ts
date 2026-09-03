import multer from "multer";

export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(Object.assign(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), { status: 400 }));
  },
}).array("images", 5);
