import { savePosts } from "./db";
import { encode as btoa } from "base-64"; // ✅ for React Native
import { safeFetch } from "../utils/fetchWrapper";

const BASE_URL = "https://contemporaryworld.ipcr.gov.ng/wp-json/wp/v2";

// 🔑 Basic Auth credentials (move to env vars in production)
const USERNAME = "ipcrcontemporaryadmin";
const PASSWORD = "SRsd 35pE aQIA yNvZ cz5f aOQJ";
const AUTH_HEADER = "Basic " + btoa(`${USERNAME}:${PASSWORD}`);

/**
 * Fetch from WP REST API using Basic Auth
 */
async function fetchFromApi(endpoint) {
  try {
    console.log("➡️ Fetching:", endpoint);

    const data = await safeFetch(endpoint, {
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
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
 * Normalize WP post → SQLite-friendly object
 */
function normalizePost(post) {
  return {
    id: post.id,
    title: post.title?.rendered || "",
    slug: post.slug,
    excerpt: post.excerpt?.rendered || "",
    content: post.content?.rendered || "",
    image: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
    category: post._embedded?.["wp:term"]?.[0]?.[0]?.name ?? "Uncategorized",
    author: post._embedded?.author?.[0]?.name ?? "Unknown",
    authorImage: post._embedded?.author?.[0]?.avatar_urls?.["48"] ?? null,
    date: post.date,
    modified: post.modified,
    views: post.views ?? post.meta?.views ?? 0,
  };
}


/**
 * Fetch latest posts
 */
export async function fetchPosts(limit = 30) {
  const raw = await fetchFromApi(
    `${BASE_URL}/posts?per_page=${limit}&_embed&orderby=date&order=desc`
  );
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePost);
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
  try {
    const raw = await fetchFromApi(`${BASE_URL}/posts/${id}?_embed`);
    if (!raw) return null;
    return normalizePost(raw);
  } catch (err) {
    console.error("fetchSinglePost error:", err.message);
    return null;
  }
}

