import type { ReactNode } from "react";

export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
  );
}
