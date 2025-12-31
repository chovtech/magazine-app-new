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
    // 👇 leave membership_level undefined → will be set in syncPosts()
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
      // Shuffle array
      const shuffled = posts
        .map((p) => ({ ...p, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ sort, ...rest }) => rest);

      // Assign membership levels: 20% free, 80% premium
      const taggedPosts = shuffled.map((post) => {
        const rand = Math.random();
        let membership_level = 2; // default premium
        if (rand < 0.2) membership_level = 0; // 20% free
        return { ...post, membership_level };
      });

      await savePosts(taggedPosts);
      console.log(`✅ Synced ${taggedPosts.length} posts into SQLite (20% free, 80% premium)`);
      return taggedPosts.length;
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

    const normalized = normalizePost(raw);

    // 👇 Assign membership level (fallback: premium if not in first 6 batch)
    return {
      ...normalized,
      membership_level: 2,
    };
  } catch (err) {
    console.error("fetchSinglePost error:", err.message);
    return null;
  }
}
