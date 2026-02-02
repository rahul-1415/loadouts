export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/collections/new",
    "/collections/:id",
    "/saved",
    "/profile/:path*",
  ],
};
