import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import {
  PROFILE_PICTURE_CONTENT_TYPES,
  ProfilePictureContentType,
} from "./dto/presign-profile-picture.dto";

const PROFILE_PUBLIC_ID_PREFIX = "jnlop/profiles";
const UPLOAD_EXPIRES_IN_SECONDS = 300;

@Injectable()
export class FilesService {
  private readonly configured: boolean;
  private readonly cloudName: string | null;
  private readonly apiKey: string | null;
  private readonly apiSecret: string | null;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET");

    if (cloudName && apiKey && apiSecret) {
      this.configured = true;
      this.cloudName = cloudName;
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.configured = false;
      this.cloudName = null;
      this.apiKey = null;
      this.apiSecret = null;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Profile picture uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      );
    }
  }

  buildPublicUrl(publicId: string): string {
    this.assertConfigured();
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { fetch_format: "auto", quality: "auto" },
      ],
    });
  }

  assertProfilePictureKeyForUser(publicId: string, userId: string): void {
    const prefix = `${PROFILE_PUBLIC_ID_PREFIX}/${userId}/`;
    if (!publicId.startsWith(prefix)) {
      throw new BadRequestException("Invalid profile picture key");
    }

    const filename = publicId.slice(prefix.length);
    if (!/^[a-f0-9-]+$/i.test(filename)) {
      throw new BadRequestException("Invalid profile picture key");
    }
  }

  createProfilePicturePresign(
    userId: string,
    contentType: ProfilePictureContentType,
    _fileSize: number,
  ) {
    this.assertConfigured();

    if (!PROFILE_PICTURE_CONTENT_TYPES.includes(contentType)) {
      throw new BadRequestException("Only JPG and PNG images are supported");
    }

    const publicId = `${PROFILE_PUBLIC_ID_PREFIX}/${userId}/${randomUUID()}`;
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
      },
      this.apiSecret!,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      key: publicId,
      publicUrl: this.buildPublicUrl(publicId),
      expiresIn: UPLOAD_EXPIRES_IN_SECONDS,
      apiKey: this.apiKey!,
      timestamp,
      signature,
    };
  }
}
