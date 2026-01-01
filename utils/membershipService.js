import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/membership";

/**
 * Fetch membership from backend using email + password,
 * then update the `user` object in AsyncStorage
 */
export async function fetchMembership() {
  try {
    const userStr = await AsyncStorage.getItem("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    if (!user?.email || !user?.auth?.password) return null;

    // Send email + password instead of token
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        password: user.auth.password,
      }),
    });

    if (!response.ok) {
      console.log("Membership fetch failed", response.status);
      return null;
    }

    const data = await response.json();

    // Normalize membership data
    const membership = {
      level_id: Number(data.level_id ?? 0),
      level_name: data.level_name || "Free",
      enddate: data.enddate ? Number(data.enddate) : null,
    };

    // Update user object in AsyncStorage
    user.membership = membership;
    await AsyncStorage.setItem("user", JSON.stringify(user));

    return membership;
  } catch (err) {
    console.error("Error fetching membership:", err);
    return null;
  }
}

/**
 * Read normalized membership directly from `user` object
 */
export async function getUserMembership() {
  try {
    const userStr = await AsyncStorage.getItem("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    const membership = user?.membership ?? {
      level_id: 0,
      level_name: "Free",
      enddate: null,
    };

    return {
      level_id: Number(membership.level_id),
      level_name: membership.level_name,
      enddate: membership.enddate,
    };
  } catch (err) {
    console.error("Failed to load membership from storage:", err);
    return null;
  }
}
