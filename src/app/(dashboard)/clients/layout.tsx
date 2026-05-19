import type { ReactNode } from "react";

interface ClientsLayoutProps {
  children: ReactNode;
}

export default function ClientsLayout({ children }: ClientsLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
  );
}
