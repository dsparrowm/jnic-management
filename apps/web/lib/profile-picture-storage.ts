import type { ProfilePicturePresignResponse } from "@/lib/api";

export async function uploadProfilePictureBlob(
  presign: ProfilePicturePresignResponse,
  blob: Blob,
  filename = "profile.jpg",
): Promise<void> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("api_key", presign.apiKey);
  formData.append("timestamp", String(presign.timestamp));
  formData.append("signature", presign.signature);
  formData.append("public_id", presign.key);

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload to storage failed");
  }
}
