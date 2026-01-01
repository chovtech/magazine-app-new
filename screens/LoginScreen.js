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

    const res = await fetch(`${WP_BASE}/wp-json/ipcr/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameOrEmail,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "Login failed");
      return;
    }

    // Normalize enddate
    const enddate = data.membership?.enddate
      ? parseInt(data.membership.enddate)
      : null;

    // ✅ Single source of truth
// ✅ Single source of truth
const user = {
  id: data.user_id,
  username: data.username,
  email: data.email,
  name: data.name,           // <-- use display_name from backend
  avatar: data.avatar,       // <-- use real avatar URL from backend

  auth: {
    token: data.token,       // keep token for future use if needed
    password,                // store password for API calls
  },

  membership: {
    level_id: data.membership.level_id,
    level_name: data.membership.level_name,
    enddate,
    source: "wordpress",
  },
};


// 🔥 Overwrite everything in AsyncStorage
await AsyncStorage.setItem("user", JSON.stringify(user));

console.log("✅ User synced with password:", user);


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
