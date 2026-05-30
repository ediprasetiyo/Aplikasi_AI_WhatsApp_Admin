import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

/**
 * Tidak set baseURL → Better-Auth pakai window.location.origin secara otomatis.
 * Ini bikin login bekerja di domain apa pun (autobalas.my.id, admin.x, vercel.app, dst.)
 * tanpa harus rebuild saat domain berubah.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
