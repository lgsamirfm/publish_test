import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export const metadata = {
  title: "پیشخوان مدیریت | بافخانه",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="bg-background">
      {/* Admin sub-top-bar */}
      <div className="border-b border-border/70 bg-secondary/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldIcon className="size-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-foreground">
                پیشخوان مدیریت
              </span>
              <span className="text-xs text-muted-foreground">
                بافخانه — بخش مدیریت
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:flex"
            >
              <ExternalLinkIcon className="size-4" />
              بازگشت به سایت
            </a>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {user.name?.charAt(0) ?? "؟"}
              </span>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-xs font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  مدیر سیستم
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin shell: sidebar + main content */}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <AdminSidebar />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
