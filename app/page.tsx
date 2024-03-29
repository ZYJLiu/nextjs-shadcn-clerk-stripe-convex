"use client";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { MapleStory } from "@/components/maplestory";
import { StableDiffusion } from "@/components/stable-diffusion";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getUser);

  const convertTimestampToDate = (timestamp: any) => {
    return new Date(timestamp).toLocaleString() || "N/A";
  };

  return (
    <div className="flex items-center justify-center">
      <MapleStory />
      {isAuthenticated ? (
        <>
          {/* <p>Subscription Ends On: {convertTimestampToDate(user?.endsOn)}</p> */}
          {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
        </>
      ) : (
        <div>
          {/* <MapleStory /> */}
          {/* <StableDiffusion /> */}
        </div>
      )}
    </div>
  );
}
