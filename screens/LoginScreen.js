import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation, route }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const WP_BASE = "https://contemporaryworld.ipcr.gov.ng";

  const handleRedirectAfterAuth = async () => {
    const redirect = route?.params?.redirectTo;
    if (redirect && redirect.screen) {
      navigation.replace(redirect.screen, redirect.params || {});
    } else {
      navigation.replace("MainTabs");
    }
  };

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      alert("Please enter email/username and password");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Login via JWT
      const loginRes = await fetch(`${WP_BASE}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        const msg =
          loginData.message || loginData.error || "Login failed. Try again.";
        alert(msg);
        return;
      }

      const token = loginData.token;
      await AsyncStorage.setItem("userToken", token);

      // 2️⃣ Fetch WordPress profile
      const profileRes = await fetch(`${WP_BASE}/wp-json/wp/v2/users/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      let profileData = {};
      if (profileRes.ok) profileData = await profileRes.json();

      // 3️⃣ Fetch membership info
      const memRes = await fetch(`${WP_BASE}/wp-json/ipcr/v1/membership`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let memData = {};
      if (memRes.ok) memData = await memRes.json();

      // Normalize membership enddate (timestamp)
      const normalizedEndDate = memData.enddate
        ? parseInt(memData.enddate)
        : null;

      // 4️⃣ Build user object
      const userObj = {
        token,
        user_id: profileData.id || memData.user_id || null,
        username: profileData.slug || memData.username || usernameOrEmail,
        email: profileData.email || memData.email || null,
        name: profileData.name || memData.name || usernameOrEmail,
        avatar:
          memData.avatar ||
          profileData.avatar_urls?.["96"] ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        membership_level: memData.level_id ?? 0,
        membership_name: memData.level_name ?? "Free",
        membership_expiry: normalizedEndDate,
      };

      // 5️⃣ Build membership object (same shape used by fetchMembership)
      const membershipObj = {
        level_id: userObj.membership_level,
        level_name: userObj.membership_name,
        enddate: userObj.membership_expiry,
        email: userObj.email,
        name: userObj.name,
        avatar: userObj.avatar,
      };

      // 6️⃣ Save both
      await AsyncStorage.setItem("user", JSON.stringify(userObj));
      await AsyncStorage.setItem("membership", JSON.stringify(membershipObj));

      console.log("✅ User + Membership synced:", {
        user: userObj,
        membership: membershipObj,
      });

      // 7️⃣ Redirect to main screen
      await handleRedirectAfterAuth();
    } catch (err) {
      console.error("Login Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={48} color="green" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Links */}
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Registration")}>
          <Text style={styles.link}>
            Don’t have an account?{" "}
            <Text style={{ fontWeight: "bold" }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 10 },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  form: { width: "100%" },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "green",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { color: "green", fontSize: 14, textAlign: "center", marginTop: 8 },
});
