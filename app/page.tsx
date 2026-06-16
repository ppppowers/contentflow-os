import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/guards";
import { homePathForRole } from "@/lib/auth/roles";

// Root: route to the right shell by role (middleware already enforced auth).
export default async function RootPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  redirect(homePathForRole(ctx.role));
}
