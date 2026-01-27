"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clearStoredReturnTo } from "@/lib/auth/return-to";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearStoredReturnTo();
    if (pathname === "/profile") {
      router.push("/");
      return;
    }
    const query = searchParams.toString();
    const returnTo = `${pathname}${query ? `?${query}` : ""}`;
    router.push(returnTo);
  };

  return <Button onClick={logout}>Logout</Button>;
}
