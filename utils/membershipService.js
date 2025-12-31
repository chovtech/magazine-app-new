// membershipService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// API endpoint to fetch membership info
const API_URL = "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/membership";

/**
 * Fetch membership from backend and update the `user` object in storage
 */
export async function fetchMembership() {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return null;

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log("Membership fetch failed", response.status);
      return null;
    }

    const data = await response.json();

    // Read current user
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : {};

    // Normalize membership data
    const membership_level = data.membership_level || data.level_id || "0";
    const membership_name = data.membership_name || data.level_name || "Free";
    let membership_expiry = Number(data.membership_expiry || data.enddate || 0);

    // Convert seconds to milliseconds if needed
    if (membership_expiry < 2000000000) membership_expiry *= 1000;

    // Update user object
    user.membership_level = String(membership_level);
    user.membership_name = membership_name;
    user.membership_expiry = membership_expiry;

    await AsyncStorage.setItem("user", JSON.stringify(user));

    return {
      membership_level: String(membership_level),
      membership_name,
      membership_expiry,
    };
  } catch (err) {
    console.error("Error fetching membership:", err);
    return null;
  }
}

/**
 * Read normalized subscription directly from `user` object
 */
export async function getUserSubscription() {
  try {
    const userStr = await AsyncStorage.getItem("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);

    let membership_expiry = Number(user.membership_expiry || 0);
    // Convert seconds to milliseconds if needed
    if (membership_expiry && membership_expiry < 2000000000) {
      membership_expiry *= 1000;
    }

    return {
      membership_level: String(user.membership_level || "0"),
      membership_name: user.membership_name || "Free",
      membership_expiry,
    };
  } catch (err) {
    console.error("Failed to load subscription from storage:", err);
    return null;
  }
}
