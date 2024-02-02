"use client";
import {
  SignInButton,
  UserButton,
  ClerkLoading,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeButton } from "./upgrade-button";

export function SignIn() {
  return (
    <div>
      <ClerkLoading>
        <Skeleton className="h-8 w-8 rounded-full" />
      </ClerkLoading>
      <SignedIn>
        <div className="flex items-center space-x-4">
          <UpgradeButton />
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline">Sign in</Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
