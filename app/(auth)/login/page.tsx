import { LoginForm } from "@/components/auth/LoginForm";

const NOTICES: Record<string, string> = {
  unavailable:
    "Can't reach the database right now. If your Supabase project is paused, restore it in the Supabase dashboard, then reload.",
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return <LoginForm notice={searchParams.error ? NOTICES[searchParams.error] : undefined} />;
}
