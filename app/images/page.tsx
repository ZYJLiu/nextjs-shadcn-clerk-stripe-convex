"use client";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

  const toggleSelection = (id: string) => {
    console.log("Toggling selection for:", id);
    setSelectedImages((prevSelected) => {
      const newSelected = new Set(prevSelected); // Create a new Set to avoid direct mutation
      if (newSelected.has(id)) {
        newSelected.delete(id); // Unselect if already selected
      } else {
        newSelected.add(id); // Select if not already selected
      }
      return newSelected;
    });
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
              <Image
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
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4">
        <Button
          variant="outline"
          onClick={() => loadMore(5)}
          disabled={status !== "CanLoadMore"}
        >
          Load More
        </Button>
      </div>
    </div>
  );
}
