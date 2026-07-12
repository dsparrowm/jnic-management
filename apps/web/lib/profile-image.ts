const MAX_OUTPUT_SIZE = 512;
const JPEG_QUALITY = 0.9;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png"]);

export function isAcceptedProfileImage(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type);
}

export function validateProfileImageFile(file: File): string | null {
  if (!isAcceptedProfileImage(file)) {
    return "Please choose a JPG or PNG image.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Image must be 2MB or smaller.";
  }
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    image.src = url;
  });
}

export async function prepareProfileImage(file: File): Promise<Blob> {
  const validationError = validateProfileImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const image = await loadImage(file);
  const side = Math.min(image.width, image.height);
  const sx = (image.width - side) / 2;
  const sy = (image.height - side) / 2;
  const outputSide = Math.min(side, MAX_OUTPUT_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = outputSide;
  canvas.height = outputSide;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image");
  }

  context.drawImage(image, sx, sy, side, side, 0, 0, outputSide, outputSide);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    throw new Error("Could not prepare image");
  }

  if (blob.size > MAX_FILE_BYTES) {
    throw new Error("Prepared image is too large. Try a smaller source file.");
  }

  return blob;
}

export async function createProfileImagePreview(file: File): Promise<string> {
  const blob = await prepareProfileImage(file);
  return URL.createObjectURL(blob);
}
