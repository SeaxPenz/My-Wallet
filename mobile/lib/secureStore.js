import { Platform } from "react-native";
import * as SecureStoreNative from "expo-secure-store";

const isWeb = Platform.OS === "web";

async function getItemAsync(key, options) {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  if (SecureStoreNative.getItemAsync)
    return SecureStoreNative.getItemAsync(key, options);
  if (SecureStoreNative.getValueWithKeyAsync)
    return SecureStoreNative.getValueWithKeyAsync(key, options);
  return null;
}

async function setItemAsync(key, value, options) {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch (e) {
      throw e;
    }
  }

  if (SecureStoreNative.setItemAsync)
    return SecureStoreNative.setItemAsync(key, value, options);
  if (SecureStoreNative.setValueForKeyAsync)
    return SecureStoreNative.setValueForKeyAsync(key, value, options);
  return;
}

async function deleteItemAsync(key, options) {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch (e) {
      return;
    }
  }

  if (SecureStoreNative.deleteItemAsync)
    return SecureStoreNative.deleteItemAsync(key, options);
  if (SecureStoreNative.deleteValueWithKeyAsync)
    return SecureStoreNative.deleteValueWithKeyAsync(key, options);
  return;
}

const AFTER_FIRST_UNLOCK = SecureStoreNative.AFTER_FIRST_UNLOCK;
const WHEN_UNLOCKED_THIS_DEVICE_ONLY =
  SecureStoreNative.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

export {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  AFTER_FIRST_UNLOCK,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  AFTER_FIRST_UNLOCK,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
