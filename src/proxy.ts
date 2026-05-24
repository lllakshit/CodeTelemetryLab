import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLogin = nextUrl.pathname === "/admin/login"

  if (nextUrl.pathname.startsWith("/admin") && !isLogin && !session) {
    const loginUrl = new URL("/admin/login", nextUrl)
    loginUrl.searchParams.set("from", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*"],
}
