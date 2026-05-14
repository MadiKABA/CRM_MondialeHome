"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoForm } from "./personal-info-form";
import { ChangePasswordForm } from "./change-password-form";
import { SecurityInfo } from "./security-info";
import { SessionsList } from "./sessions-list";
import type { ProfileDTO, SessionDTO } from "../types";

interface ProfileTabsProps {
  profile: ProfileDTO;
  sessions: SessionDTO[];
  defaultTab?: string;
}

export function ProfileTabs({
  profile,
  sessions,
  defaultTab = "informations",
}: ProfileTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-6 w-full justify-start overflow-x-auto">
        <TabsTrigger value="informations" className="shrink-0">
          Informations
        </TabsTrigger>
        <TabsTrigger value="securite" className="shrink-0">
          Sécurité
        </TabsTrigger>
        <TabsTrigger value="sessions" className="shrink-0">
          Sessions
          {sessions.length > 0 && (
            <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
              {sessions.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="informations" className="space-y-6">
        <PersonalInfoForm profile={profile} />
      </TabsContent>

      <TabsContent value="securite" className="space-y-6">
        <ChangePasswordForm />
        <SecurityInfo profile={profile} />
      </TabsContent>

      <TabsContent value="sessions" className="space-y-6">
        <SessionsList sessions={sessions} />
      </TabsContent>
    </Tabs>
  );
}
