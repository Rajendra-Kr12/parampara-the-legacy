/**
 * Clerk token cache backed by the device's secure storage: the iOS Keychain and
 * Android's Keystore-backed storage, never AsyncStorage or a file.
 *
 * Clerk's bundled `@clerk/expo/token-cache` uses AFTER_FIRST_UNLOCK, which lets the
 * item move to a new phone through an encrypted iCloud or iTunes backup. This cache
 * uses AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY so the Clerk client token stays on this
 * device; Android backup is off in app.json (`allowBackup: false`). Tokens are never
 * logged.
 */
import type { TokenCache } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";

/** The part of expo-secure-store this cache uses, so tests can pass a fake. */
export interface SecureStoreLike {
  getItemAsync(key: string, options: SecureStore.SecureStoreOptions): Promise<string | null>;
  setItemAsync(key: string, value: string, options: SecureStore.SecureStoreOptions): Promise<void>;
  deleteItemAsync(key: string, options: SecureStore.SecureStoreOptions): Promise<void>;
}

export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export function createDeviceTokenCache(store: SecureStoreLike): TokenCache {
  return {
    async getToken(key) {
      try {
        return await store.getItemAsync(key, secureStoreOptions);
      } catch {
        // An unreadable item (for example after a Keychain reset) is dropped so
        // Clerk starts a fresh sign-in instead of failing on every launch.
        try {
          await store.deleteItemAsync(key, secureStoreOptions);
        } catch {
          // Nothing more to do: the caller sees "no token" either way.
        }
        return null;
      }
    },
    saveToken(key, token) {
      return store.setItemAsync(key, token, secureStoreOptions);
    },
    clearToken(key) {
      return store.deleteItemAsync(key, secureStoreOptions);
    },
  };
}

export const deviceTokenCache = createDeviceTokenCache(SecureStore);
