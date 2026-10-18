import React from "react";

export const metadata = {
  title: "Admin Panel | SIMATA MI Bustanul Huda",
  description: "Panel Administrasi SIMATA MI Bustanul Huda",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
