import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth client. Same-origin as the server, so no baseURL needed.
 * Import the hooks/actions from here in Client Components.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
