"use client";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ListChecks } from "lucide-react";
import { set } from "react-hook-form";

export default function Images() {
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated) {
    return <></>;
  }

  const [selectedImages, setSelectedImages] = useState(new Set());
  const { results, status, loadMore } = usePaginatedQuery(
    api.images.getImages,
    {},
    { initialNumItems: 10 },
  );

  const deleteImages = useMutation(api.images.deleteImages);
  const unlinkUserFromImages = useMutation(api.images.unlinkUserFromImages);

  function handleDeleteAndClear() {
    deleteImages({ ids: Array.from(selectedImages) as Id<"images">[] });
    setSelectedImages(new Set());
  }

  function handleUnlinkUserFromImages() {
    unlinkUserFromImages({ ids: Array.from(selectedImages) as Id<"images">[] });
    setSelectedImages(new Set());
  }

  const handleSelectAll = () => {
    if (results.length === selectedImages.size) {
      setSelectedImages(new Set());
    } else {
      const allImageIds = results.map((image) => image._id);
      setSelectedImages(new Set(allImageIds));
    }
  };

  const toggleSelection = (id: string) => {
    console.log("Toggling selection for:", id);
    setSelectedImages((prevSelected) => {
      const newSelected = new Set(prevSelected); // Create a new Set to avoid direct mutation
      if (newSelected.has(id)) {
        newSelected.delete(id); // Unselect if already selected
      } else {
        newSelected.add(id); // Select if not already selected
      }
      console.log("New selected:", newSelected);
      return newSelected;
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleImageToVideo = async () => {
    setIsLoading(true);
    console.log("Image to Video");
    const selectedImageUrls = results
      .filter((image) => selectedImages.has(image._id))
      .map((image) => image.imageUrl);

    setSelectedImages(new Set());
    try {
      // Map each imageUrl to a promise that performs the resize and fetch operation
      const videoGenerationPromises = selectedImageUrls.map(
        async (imageUrl) => {
          // stable diffusion api requires specific image size
          const resizedImageFile = await resizeImageTo768x768(imageUrl!);

          const formData = new FormData();
          formData.append("file", resizedImageFile);

          // generate video from image using stable diffusion api
          const response = await fetch("/api/image-to-video", {
            method: "POST",
            body: formData,
          });

          const { id } = await response.json();
          console.log(id);
          return id;
        },
      );

      const videoIds = Promise.all(videoGenerationPromises);
      console.log(videoIds);
    } catch (error) {
      console.error("Failed to fetch image:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="mx-3 mb-3 flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {results.map((image, index) => (
          <div
            key={image._id}
            className="relative w-full cursor-pointer p-2 transition-transform duration-200 ease-in-out hover:scale-105"
            onClick={() => toggleSelection(image._id)}
          >
            <div
              className={`overflow-hidden rounded-lg border-2 ${
                selectedImages.has(image._id)
                  ? "border-white"
                  : "hover:border-gray-600"
              }`}
            >
              <NextImage
                alt={`img-${index}`}
                layout="responsive"
                width={500}
                height={500}
                objectFit="contain"
                src={image.imageUrl ?? ""}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center space-x-2 pb-4">
        <Button
          variant="outline"
          onClick={handleUnlinkUserFromImages}
          disabled={selectedImages.size === 0}
        >
          Transfer
        </Button>

        <Button
          variant="outline"
          onClick={() => loadMore(30)}
          disabled={status !== "CanLoadMore"}
        >
          Load More
        </Button>

        <Button
          variant="outline"
          onClick={handleImageToVideo}
          disabled={selectedImages.size === 0}
        >
          Video
        </Button>

        <Button
          variant="outline"
          onClick={handleDeleteAndClear}
          disabled={selectedImages.size === 0}
        >
          Delete
        </Button>

        <Toggle
          variant="outline"
          aria-label="Select All"
          onClick={handleSelectAll}
        >
          <ListChecks className="h-4 w-4" />
        </Toggle>
      </div>
    </div>
  );
}

const resizeImageTo768x768 = async (imageUrl: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // Create a canvas and resize it to 768x768
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 768;
      const ctx = canvas.getContext("2d");

      // Draw the image onto the canvas, resizing it in the process
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Convert the blob to a File object
          const imageFile = new File([blob], "resized_image.jpg", {
            type: "image/jpeg",
          });
          resolve(imageFile);
        } else {
          reject(new Error("Canvas to Blob conversion failed"));
        }
      }, "image/jpeg");
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imageUrl;
  });
};

// Upload the video to Convex
// move this to an action
async function uploadVideo(videoBlob: Blob, postUrl: string) {
  // Upload the image using the generated URL
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": videoBlob.type },
    body: videoBlob,
  });

  // Extract the convex storageId from the response
  const { storageId } = await result.json();
  console.log(storageId);
}
