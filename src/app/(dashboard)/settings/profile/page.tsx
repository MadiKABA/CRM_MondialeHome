import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import {
  getCurrentUserProfile,
  getCurrentUserSessions,
} from "@/features/profile/server/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";

async function ProfileContent() {
  let profile;
  let sessions;

  try {
    [profile, sessions] = await Promise.all([
      getCurrentUserProfile(),
      getCurrentUserSessions(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    throw error;
  }

  return (
    <>
      <ProfileHeader profile={profile} />
      <ProfileTabs profile={profile} sessions={sessions} />
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-card border-border rounded-xl border p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="size-24 rounded-full md:size-28" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Gérez vos informations personnelles et la sécurité de votre compte"
      />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: "Mon profil — Mondiale Home CRM",
};
