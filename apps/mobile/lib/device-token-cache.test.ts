import { describe, expect, it } from "@jest/globals";
import * as SecureStore from "expo-secure-store";
import {
  createDeviceTokenCache,
  secureStoreOptions,
  type SecureStoreLike,
} from "./device-token-cache";

interface Call {
  readonly method: "get" | "set" | "delete";
  readonly key: string;
  readonly options: SecureStore.SecureStoreOptions;
}

function fakeStore(options: { readonly failReads?: boolean } = {}) {
  const items = new Map<string, string>();
  const calls: Call[] = [];
  const store: SecureStoreLike = {
    getItemAsync(key, opts) {
      calls.push({ method: "get", key, options: opts });
      if (options.failReads === true) {
        return Promise.reject(new Error("keychain read failed"));
      }
      return Promise.resolve(items.get(key) ?? null);
    },
    setItemAsync(key, value, opts) {
      calls.push({ method: "set", key, options: opts });
      items.set(key, value);
      return Promise.resolve();
    },
    deleteItemAsync(key, opts) {
      calls.push({ method: "delete", key, options: opts });
      items.delete(key);
      return Promise.resolve();
    },
  };
  return { store, items, calls };
}

describe("device token cache", () => {
  it("keeps the item on this device only, after first unlock", () => {
    expect(secureStoreOptions.keychainAccessible).toBe(
      SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    );
    expect(secureStoreOptions.keychainAccessible).not.toBe(SecureStore.AFTER_FIRST_UNLOCK);
  });

  it("saves, reads and clears a token with the device-only option on every call", async () => {
    const { store, calls } = fakeStore();
    const cache = createDeviceTokenCache(store);

    await cache.saveToken("__clerk_client_jwt", "token-1");
    expect(await cache.getToken("__clerk_client_jwt")).toBe("token-1");
    await cache.clearToken?.("__clerk_client_jwt");
    expect(await cache.getToken("__clerk_client_jwt")).toBeNull();

    expect(calls.map((call) => call.method)).toEqual(["set", "get", "delete", "get"]);
    for (const call of calls) {
      expect(call.options).toBe(secureStoreOptions);
    }
  });

  it("returns null for a key that was never saved", async () => {
    const cache = createDeviceTokenCache(fakeStore().store);
    expect(await cache.getToken("missing")).toBeNull();
  });

  it("deletes the item and returns null when the read fails", async () => {
    const { store, calls } = fakeStore({ failReads: true });
    const cache = createDeviceTokenCache(store);

    expect(await cache.getToken("__clerk_client_jwt")).toBeNull();
    expect(calls.map((call) => `${call.method}:${call.key}`)).toEqual([
      "get:__clerk_client_jwt",
      "delete:__clerk_client_jwt",
    ]);
  });

  it("still returns null when deleting the unreadable item also fails", async () => {
    const store: SecureStoreLike = {
      getItemAsync: () => Promise.reject(new Error("read failed")),
      setItemAsync: () => Promise.resolve(),
      deleteItemAsync: () => Promise.reject(new Error("delete failed")),
    };
    expect(await createDeviceTokenCache(store).getToken("k")).toBeNull();
  });
});
