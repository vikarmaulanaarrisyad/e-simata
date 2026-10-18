import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginView } from "@/components/admin/admin-login-view";

export const metadata = {
  title: "Login Admin | SIMATA MI Bustanul Huda",
  description: "Masuk ke Panel Administrasi SIMATA MI Bustanul Huda",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return <AdminLoginView />;
}
