import NextAuth, { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

// Debug logging for environment variables
console.log("Debug Auth Env:", {
    existsId: !!clientId,
    idLen: clientId?.length,
    existsSecret: !!clientSecret,
    nodeEnv: process.env.NODE_ENV
});

if (!clientId) {
    console.error("ERROR: GITHUB_CLIENT_ID is missing from environment variables.");
}

export const authOptions: AuthOptions = {
    providers: [
        GithubProvider({
            clientId: clientId || "",
            clientSecret: clientSecret || "",
            authorization: { params: { scope: "repo read:user user:email" } },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({ session, token }) {
            // @ts-ignore
            session.accessToken = token.accessToken as string
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "default_secret_dev",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
