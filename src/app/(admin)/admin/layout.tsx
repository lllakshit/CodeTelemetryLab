import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AdminShell } from "@/components/admin-shell"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  return <AdminShell>{children}</AdminShell>
}
