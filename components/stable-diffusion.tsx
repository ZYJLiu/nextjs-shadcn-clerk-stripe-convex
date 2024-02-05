"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function StableDiffusion({ imageSrc }: { imageSrc: string }) {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const imageFile = await convertUrlToResizedFile(imageSrc);

      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/stable-diffusion", {
        method: "POST",
        body: formData,
      });

      const { imageData } = await response.json();
      console.log(imageData[0]);

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
        disabled={isLoading}
        onClick={!isLoading ? handleClick : undefined}
        className="mb-3 mt-3 flex w-40 max-w-xs items-center justify-center"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          "Stable Diffusion"
        )}
      </Button>

      <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {images.map((imgBase64, index) => (
          <div key={index} className="h-[400px] w-full">
            <img
              alt={`img-${index}`}
              className="h-full w-full object-cover" // Adjusted to fill the container
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
