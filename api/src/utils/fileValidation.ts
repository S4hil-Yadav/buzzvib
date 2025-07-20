import { fileTypeFromFile } from "file-type";

export async function hasInvalidFile(files: Express.Multer.File[]) {
  for await (const f of files) {
    if (typeof f !== "object" || typeof f.mimetype !== "string" || !f.path) return true;

    const detected = await fileTypeFromFile(f.path);

    if (!detected) return true;
    f.mimetype = detected.mime;
    if (!(detected.mime.startsWith("image/") || detected.mime.startsWith("video/"))) return true;
  }

  return false;
}
