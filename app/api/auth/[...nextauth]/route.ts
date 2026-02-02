import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@auth/supabase-adapter";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const authOptions: NextAuthOptions = {
  adapter:
    supabaseUrl && supabaseServiceRoleKey
      ? SupabaseAdapter({
          url: supabaseUrl,
          secret: supabaseServiceRoleKey,
        })
      : undefined,
  session: { strategy: "jwt" },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? "",
      from: process.env.EMAIL_FROM ?? "",
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
