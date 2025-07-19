import UserModel from "@/models/user.model.js";
import axios from "axios";
import cloudinary from "@/lib/cloudinary.js";
import type { UploadApiResponse, UploadApiOptions } from "cloudinary";
import { User } from "@/types/user.js";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MAX_USERNAME_LENGTH = 20;

export async function generateUniqueUsername(name: string): Promise<string> {
  const base = slugifyName(name).slice(0, MAX_USERNAME_LENGTH);
  const regex = new RegExp(`^${base}\\d*$`, "i");

  const existingUsernames = await UserModel.find({ username: regex, deletedAt: null })
    .select("-_id username")
    .lean<Pick<User, "username">[]>();

  const existingSet = new Set(existingUsernames.map(u => u.username));

  if (!existingSet.has(base)) {
    return base;
  }

  for (let i = 1; i < 1000; i++) {
    const candidate = `${base.slice(0, MAX_USERNAME_LENGTH - String(i).length)}${i}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique username after many attempts.");
}

export function generateRandomPassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function uploadImageFromUrl(imageUrl: string, options?: UploadApiOptions): Promise<UploadApiResponse> {
  const response = await axios.get(imageUrl, { responseType: "stream" });

  const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options ?? {}, (error, result) => {
      if (error || !result) return reject(error);
      resolve(result);
    });

    response.data.pipe(uploadStream);
  });

  return uploadResponse;
}
