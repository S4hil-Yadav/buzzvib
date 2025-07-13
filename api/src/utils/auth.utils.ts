import UserModel from "@/models/user.model.js";
import axios from "axios";
import cloudinary from "@/lib/cloudinary.js";
import { UploadApiResponse } from "cloudinary";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MAX_USERNAME_LENGTH = 20;

export async function generateUniqueUsername(name: string): Promise<string> {
  const base = slugifyName(name);
  let username = base.slice(0, MAX_USERNAME_LENGTH);
  let count = 0;

  while (await UserModel.exists({ username })) {
    count++;
    const suffix = String(count);
    const allowedBaseLength = MAX_USERNAME_LENGTH - suffix.length;

    username = `${base.slice(0, allowedBaseLength)}${suffix}`;
  }

  return username;
}

export function generateRandomPassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function uploadImageFromUrl(imageUrl: string, options?: { folder?: string }): Promise<UploadApiResponse> {
  const response = await axios.get(imageUrl, { responseType: "stream" });

  const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: options?.folder ?? "uploads" }, (err, result) => {
      if (err || !result) {
        return reject(err);
      }
      resolve(result);
    });

    response.data.pipe(uploadStream);
  });

  return uploadResponse;
}
