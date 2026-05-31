import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { BottomNavigation } from "@/components/BottomNavigation";
import { MobileHeader } from "@/components/MobileHeader";
import { TopNavigation } from "@/components/TopNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50">
        <MobileHeader />
        <TopNavigation />
        <main className="mx-auto min-h-screen max-w-[480px] pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:max-w-7xl lg:px-8 lg:pb-12">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </AuthProvider>
  );
}
