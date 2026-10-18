import React from "react";

export const metadata = {
  title: "Admin Panel | SIMATA MI Bustanul Huda Dawuhan",
  description: "Panel Administrasi SIMATA MI Bustanul Huda Dawuhan",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
