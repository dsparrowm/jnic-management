"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { ErrorText } from "@/components/auth/auth-card";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Button } from "@/components/ui/button";
import { api, ApiError, UserRecord } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import {
  createProfileImagePreview,
  prepareProfileImage,
  validateProfileImageFile,
} from "@/lib/profile-image";

interface ProfilePictureUploadProps {
  user: UserRecord;
  onUpdated: (user: UserRecord) => void;
}

export function ProfilePictureUpload({ user, onUpdated }: ProfilePictureUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPendingFile(null);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateProfileImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    clearPreview();

    try {
      const nextPreview = await createProfileImagePreview(file);
      previewUrlRef.current = nextPreview;
      setPreviewUrl(nextPreview);
      setPendingFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare image");
    }
  }

  async function handleUpload() {
    if (!pendingFile) return;

    const token = getAccessToken();
    if (!token) return;

    setUploading(true);
    setError(undefined);

    try {
      const blob = await prepareProfileImage(pendingFile);
      const presign = await api.presignProfilePicture(token, {
        contentType: "image/jpeg",
        fileSize: blob.size,
      });

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed");
      }

      const updated = await api.updateProfilePicture(token, { key: presign.key });
      onUpdated(updated);
      clearPreview();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = previewUrl ?? user.profilePicUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          name={user.name}
          profilePicUrl={displayUrl}
          className="h-24 w-24"
          fallbackClassName="text-xl"
        />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Upload a square JPG or PNG up to 2MB. Images are center-cropped before upload.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
              Choose photo
            </Button>
            {pendingFile && (
              <>
                <Button type="button" onClick={() => void handleUpload()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save photo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearPreview}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />

      {error && <ErrorText message={error} />}
    </div>
  );
}
