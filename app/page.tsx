"use client";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getUser);

  const convertTimestampToDate = (timestamp: any) => {
    return new Date(timestamp).toLocaleString() || "N/A";
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {isAuthenticated ? (
        <>
          <p>Subscription Ends On: {convertTimestampToDate(user?.endsOn)}</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </>
      ) : (
        <p>Sign In</p>
      )}
    </div>
  );
}
