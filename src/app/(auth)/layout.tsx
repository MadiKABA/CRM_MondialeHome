export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary text-primary-foreground font-heading flex h-10 w-10 items-center justify-center rounded-xl font-bold">
          MH
        </div>
        <div>
          <p className="font-heading text-lg leading-none font-semibold">Mondial Home</p>
          <p className="text-muted-foreground text-xs">CRM Platform</p>
        </div>
      </div>
      {children}
    </div>
  );
}
