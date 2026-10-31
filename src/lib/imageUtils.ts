const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB safety limit
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Compresses an uploaded image File into a crisp JPEG Data URL using an HTML5 Canvas
 * so it can be stored directly and quickly in Firestore without exceeding document limits.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 720,
  maxHeight = 540,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/") || !ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
      reject(new Error("Please select a valid image file (JPG, PNG, WebP, or GIF)."));
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      reject(new Error("Image file is too large (max 15 MB). Please choose a smaller photo."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image file."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        // Fill dark background in case of transparent PNGs
        ctx.fillStyle = "#070d1f";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
