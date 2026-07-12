import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import {
  PROFILE_PICTURE_CONTENT_TYPES,
  ProfilePictureContentType,
} from "./dto/presign-profile-picture.dto";

const EXTENSION_BY_CONTENT_TYPE: Record<ProfilePictureContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

@Injectable()
export class FilesService {
  private readonly client: S3Client | null;
  private readonly bucket: string | null;
  private readonly publicUrlBase: string | null;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    const bucket = this.config.get<string>("R2_BUCKET_NAME");
    const publicUrl = this.config.get<string>("R2_PUBLIC_URL");

    if (accountId && accessKeyId && secretAccessKey && bucket && publicUrl) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.bucket = bucket;
      this.publicUrlBase = publicUrl.replace(/\/$/, "");
    } else {
      this.client = null;
      this.bucket = null;
      this.publicUrlBase = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.bucket !== null && this.publicUrlBase !== null;
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Profile picture uploads are not configured. Set R2 environment variables.",
      );
    }
  }

  buildPublicUrl(key: string): string {
    this.assertConfigured();
    return `${this.publicUrlBase}/${key}`;
  }

  assertProfilePictureKeyForUser(key: string, userId: string): void {
    const prefix = `profiles/${userId}/`;
    if (!key.startsWith(prefix)) {
      throw new BadRequestException("Invalid profile picture key");
    }

    const filename = key.slice(prefix.length);
    if (!/^[a-f0-9-]+\.(jpg|png)$/i.test(filename)) {
      throw new BadRequestException("Invalid profile picture key");
    }
  }

  async createProfilePicturePresign(
    userId: string,
    contentType: ProfilePictureContentType,
    fileSize: number,
  ) {
    this.assertConfigured();

    if (!PROFILE_PICTURE_CONTENT_TYPES.includes(contentType)) {
      throw new BadRequestException("Only JPG and PNG images are supported");
    }

    const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
    const key = `profiles/${userId}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket!,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(this.client!, command, { expiresIn: 300 });

    return {
      uploadUrl,
      key,
      publicUrl: this.buildPublicUrl(key),
      expiresIn: 300,
    };
  }
}
