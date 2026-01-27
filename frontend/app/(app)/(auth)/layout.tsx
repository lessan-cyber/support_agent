import { AuthBackground } from "@/components/auth/auth-bg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBackground>
      {children}
    </AuthBackground>
  );
}