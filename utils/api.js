// utils/api.js
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (err.message === "Network request failed") {
      throw new Error("Unable to connect. Please check your internet connection.");
    }
    throw err; // fallback
  }
}
