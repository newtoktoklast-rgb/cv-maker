import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "k18epz7k",
  api_secret: process.env.CLOUDINARY_API_SECRET || "QTb5UWehaAeUl1sjBLAtALvppAI",
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadFileToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult | null> {
  try {
    const base64Str = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";

    const result = await cloudinary.uploader.upload(base64Str, {
      folder: "cv-maker-documents",
      resource_type: resourceType,
      public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}`,
    });

    if (result && result.secure_url) {
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }
    return null;
  } catch (error) {
    console.warn("Cloudinary upload skipped, storing in secure server database storage:", error);
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId || publicId.startsWith("local_")) return true;
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    return false;
  }
}

export default cloudinary;
