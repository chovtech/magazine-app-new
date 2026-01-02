import { savePosts } from "./db";
import { encode as btoa } from "base-64"; // ✅ for React Native
import { safeFetch } from "../utils/fetchWrapper";

//const BASE_URL = "https://contemporaryworld.ipcr.gov.ng/wp-json/wp/v2";
const BASE_URL = "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1";

/**
 * Fetch from WP REST API using Basic Auth
 */
async function fetchFromApi(endpoint) {
  try {
    console.log("➡️ Fetching:", endpoint);

    const data = await safeFetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ReactNativeApp/1.0",
      },
    });

    return data;
  } catch (error) {
    console.error("fetchFromApi error:", error.message);
    return [];
  }
}


/**
 * Fetch latest posts
 */
export async function fetchPosts(limit = 30) {
  const raw = await fetchFromApi(`${BASE_URL}/posts?per_page=${limit}`);
  if (!Array.isArray(raw)) return [];
  return raw;
}


/**
 * Sync posts into SQLite
 *
 */
/**
 * Sync posts into SQLite
 */
export async function syncPosts(limit = 10) {
  try {
    const posts = await fetchPosts(limit);
    if (posts.length > 0) {
      await savePosts(posts);
      console.log(`✅ Synced ${posts.length} posts into SQLite`);
      return posts.length;
    }
    return 0;
  } catch (err) {
    console.error("syncPosts error:", err.message);
    return 0;
  }
}



/**
 * Background refresh helper
 */
export async function refreshPostsInBackground(limit = 10) {
  try {
    return await syncPosts(limit);
  } catch (err) {
    console.error("refreshPostsInBackground error:", err.message);
    return 0;
  }
}

/**
 * Fetch single post by ID
 */
export async function fetchSinglePost(id) {
  const posts = await fetchPosts(50);
  return posts.find(p => p.id === id) ?? null;
}


