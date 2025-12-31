// storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeFetch } from "../utils/fetchWrapper";
import { getPostById } from "./db";

const API_URL = "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/settings";
const STORAGE_KEY = "ipcr_settings";
const USER_SUBSCRIPTION_KEY = "user_subscription";
const USER_TOKEN_KEY = "userToken"; // stored after login
const USER_SESSION_KEY = "user_session"; // unified session info

// -------------------
// Helpers
// -------------------

// Clean up API HTML (remove \r\n and unescape quotes)
function cleanHTML(raw) {
  if (!raw) return "";
  return raw.replace(/\\r\\n/g, "").replace(/\\"/g, '"');
}

// Normalize API data
function normalizeData(json) {
  if (!json?.data) return json;
  const cleaned = {};
  for (const key in json.data) {
    cleaned[key] = cleanHTML(json.data[key]);
  }
  return { ...json, data: cleaned };
}

// -------------------
// Settings
// -------------------

export async function syncSettings() {
  try {
    const json = await safeFetch(API_URL);
    const normalized = normalizeData(json);

    if (normalized?.data && normalized?.last_updated) {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      let existingData = existing ? JSON.parse(existing) : null;

      if (!existingData || normalized.last_updated > existingData.last_updated) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
      return existingData;
    }
  } catch (error) {
    console.log("Error syncing settings:", error.message);
  }

  const fallback = await AsyncStorage.getItem(STORAGE_KEY);
  return fallback ? JSON.parse(fallback) : null;
}

export async function getSettings() {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

// -------------------
// Subscription helpers
// -------------------

export async function setUserSubscription(subscription) {
  await AsyncStorage.setItem(USER_SUBSCRIPTION_KEY, JSON.stringify(subscription));
}

export async function getUserSubscription() {
  const data = await AsyncStorage.getItem(USER_SUBSCRIPTION_KEY);
  return data ? JSON.parse(data) : { active: false, expiry: null };
}

export async function hasActiveSubscription() {
  const sub = await getUserSubscription();
  if (!sub.active) return false;

  const now = new Date();
  const expiry = new Date(sub.expiry);
  if (expiry <= now) {
    // Expired → reset
    await setUserSubscription({ active: false, expiry: null });
    return false;
  }
  return true;
}

// -------------------
// User token helpers
// -------------------

export async function setUserToken(token) {
  await AsyncStorage.setItem(USER_TOKEN_KEY, token);
}

export async function getUserToken() {
  return await AsyncStorage.getItem(USER_TOKEN_KEY);
}

export async function clearUserToken() {
  await AsyncStorage.removeItem(USER_TOKEN_KEY);
}

export async function isLoggedIn() {
  const token = await getUserToken();
  return !!token; // true if token exists
}

// -------------------
// Unified Session (login + subscription)
// -------------------

export async function setUserSession(session) {
  await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export async function getUserSession() {
  const data = await AsyncStorage.getItem(USER_SESSION_KEY);
  return data ? JSON.parse(data) : { loggedIn: false, subscription: { active: false, expiry: null } };
}

export async function clearUserSession() {
  await AsyncStorage.removeItem(USER_SESSION_KEY);
}

// -------------------
// Membership helpers
// -------------------

export async function canAccessPost(postId) {
  const post = await getPostById(postId);
  if (!post) return false;

  const loggedIn = await isLoggedIn();

  switch (post.membership_level) {
    case 0: // public
      return true;
    case 1: // logged-in only
      return loggedIn;
    case 2: // premium only
      return loggedIn && await hasActiveSubscription();
    default:
      return false;
  }
}
