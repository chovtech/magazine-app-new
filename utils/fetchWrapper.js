// utils/fetchWrapper.js
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`❌ Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes("Network request failed")) {
      throw new Error("⚠️ Please check your internet connection.");
    }
    throw error;
  }
}
