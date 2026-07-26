"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
};

export function LogoutButton({
  className,
  variant = "outline",
  size = "default",
  label = "خروج",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLoading(false);
      toast.error("خروج با خطا مواجه شد. دوباره تلاش کنید.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={loading}
      aria-label={label}
    >
      <LogOut className="size-4" />
      {label}
    </Button>
  );
}
