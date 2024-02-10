"use client";
import { Button } from "@/components/ui/button";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { image } from "@/lib/image";

export function StableDiffusion({ imageSrc }: { imageSrc: string }) {
  const { isAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([image]);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const imageFile = await convertUrlToResizedFile(imageSrc);

      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/image-to-image", {
        method: "POST",
        body: formData,
      });

      const { imageData } = await response.json();
      console.log(imageData);

      setImages(imageData);
    } catch (error) {
      console.error("Failed to fetch image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        disabled={!isAuthenticated || isLoading}
        onClick={handleClick}
        className="mb-2 mt-2 flex w-40 max-w-xs items-center justify-center"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          "Stable Diffusion"
        )}
      </Button>

      <div
        className={`${
          images.length <= 5
            ? "flex flex-wrap items-start justify-center"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        }`}
      >
        {images.map((imgBase64, index) => (
          <div
            key={index}
            className="h-[400px] w-full overflow-hidden rounded-3xl border-2 bg-black md:w-auto"
          >
            <img
              alt={`img-${index}`}
              className="h-full w-full object-cover"
              src={imgBase64}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

async function convertUrlToResizedFile(
  imageUrl: string,
  targetWidth: number = 1024,
  targetHeight: number = 1024,
): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate the scale to maintain aspect ratio
      const scale = Math.min(
        targetWidth / img.width,
        targetHeight / img.height,
      );

      // Calculate the new dimensions
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Calculate the position to center the image
      const offsetX = (targetWidth - scaledWidth) / 2;
      const offsetY = (targetHeight - scaledHeight) / 2;

      // Create canvas with target dimensions
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d")!;

      // Fill canvas with a background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw the image centered on the canvas
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      canvas.toBlob((resizedBlob) => {
        if (resizedBlob) {
          const filename = imageUrl.split("/").pop();
          const resizedFile = new File([resizedBlob], filename!, {
            type: resizedBlob.type,
          });

          console.log("Resized file:", resizedFile);
          resolve(resizedFile);
        } else {
          reject(new Error("Failed to resize image"));
        }
      }, "image/jpeg");
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

async function convertBlobToArrayBuffer(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
