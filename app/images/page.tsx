"use client";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated) {
    return <></>;
  }

  const images = useQuery(api.images.getImages);
  console.log("images:", images);

  return (
    <div className="flex items-center justify-center">
      <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {images &&
          [...images]
            .slice(-30)
            .reverse()
            .map((data, index) => (
              <div key={index} className="h-[400px] w-full">
                <img
                  alt={`img-${index}`}
                  className="h-full w-full object-cover"
                  src={data.url ?? ""}
                />
              </div>
            ))}
      </div>
    </div>
  );
}
