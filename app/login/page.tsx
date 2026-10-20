import type { Metadata } from "next";
import { LoginForm } from "@/components/pages/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke sistem kasir dan manajemen WarungKu.",
};

export default function LoginPage() {
  return <LoginForm />;
}
