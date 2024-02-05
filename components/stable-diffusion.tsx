"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function StableDiffusion() {
  const [images, setImages] = useState([]);

  const handleClick = async () => {
    // const imageSrc =
    //   "https://maplestory.io/api/character/%7B%22itemId%22%3A2000%2C%22region%22%3A%22KMS%22%2C%22version%22%3A%22359%22%7D%2C%7B%22itemId%22%3A12000%2C%22region%22%3A%22KMS%22%2C%22version%22%3A%22359%22%7D%2C%7B%22itemId%22%3A20030%2C%22animationName%22%3A%22default%22%2C%22region%22%3A%22KMS%22%2C%22version%22%3A%22359%22%7D/stand1/0?showears=false&showLefEars=false&resize=1&name=&flipX=false";

    const imageSrc =
      "https://maplestory.io/api/GMS/216/mob/100100/render/stand/1";

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
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={handleClick}>
        Stable Diffusion
      </Button>

      <div className="grid grid-cols-3 gap-4">
        {images.map((imgBase64, index) => (
          <div key={index} className="h-[400px] w-[400px]">
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
  imageUrl,
  targetWidth = 1024,
  targetHeight = 1024,
) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((resizedBlob) => {
        if (resizedBlob) {
          const filename = imageUrl.split("/").pop(); // Extract a filename from the URL
          const resizedFile = new File([resizedBlob], filename, {
            type: resizedBlob.type,
          });
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

// async function convertUrlToFile(imageUrl) {
//   const response = await fetch(imageUrl);
//   const blob = await response.blob();
//   const filename = imageUrl.split("/").pop(); // Extract a filename from the URL
//   return new File([blob], filename, { type: blob.type });
// }

// async function convertImageToBase64(
//   imageUrl,
//   targetWidth = 1024,
//   targetHeight = 1024,
// ) {
//   const response = await fetch(imageUrl);
//   const blob = await response.blob();

//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => {
//       // Create a canvas with the desired dimensions
//       const canvas = document.createElement("canvas");
//       canvas.width = targetWidth;
//       canvas.height = targetHeight;

//       // Draw the image onto the canvas, resizing it
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

//       // Convert the canvas to a base64 string
//       resolve(canvas.toDataURL());
//     };
//     img.onerror = reject;
//     img.src = URL.createObjectURL(blob);
//   });
// }
