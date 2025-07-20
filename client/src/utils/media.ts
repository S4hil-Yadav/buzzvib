import type { CreateMedia } from "@/types";
import type { Crop } from "react-image-crop";

export function getCroppedImage(image: HTMLImageElement, crop: Crop): Promise<{ blob: Blob; url: string }> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error("Failed to create blob"));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      "image/jpeg",
      1
    );
  });
}

export async function generateVideoThumbnail(videoFile: File) {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  return new Promise<string>(resolve => {
    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      video.currentTime = 0;
    });

    video.addEventListener("seeked", () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(URL.createObjectURL(videoFile));
            }
          },
          "image/jpeg",
          1
        );
      }
    });

    video.src = URL.createObjectURL(videoFile);
    video.load();
  }).catch(() => URL.createObjectURL(videoFile));
}

export function revokeURLs(file: CreateMedia) {
  if (file.url.startsWith("blob:")) {
    URL.revokeObjectURL(file.url);
  }
  if (file.originalUrl.startsWith("blob:")) {
    URL.revokeObjectURL(file.originalUrl);
  }
}
