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

export default function RegistrationScreen({ navigation, route }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Replace with your WP base URL
  const WP_BASE = "https://contemporaryworld.ipcr.gov.ng";

  const handleRedirectAfterAuth = async () => {
    const redirect = route?.params?.redirectTo;
    if (redirect && redirect.screen) {
      // redirectTo should be of form: { screen: 'ArticleDetails', params: { id: 123 } }
      navigation.replace(redirect.screen, redirect.params || {});
    } else {
      navigation.replace("MainTabs");
    }
  };

 const handleRegister = async () => {
  if (!name || !username || !email || !password || !confirmPassword) {
    alert("Please fill in all fields");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    setLoading(true);

    // 1) Register user (your custom endpoint)
    const registerRes = await fetch(`${WP_BASE}/wp-json/ipcr/v1/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        username,
        email,
        password,
      }),
    });

    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      const msg =
        registerData.message || registerData.error || "Registration failed";
      alert(msg);
      return;
    }

    // 2) Auto-login (JWT)
    const loginRes = await fetch(`${WP_BASE}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      const msg =
        loginData.message ||
        loginData.error ||
        "Auto-login failed. Please login manually.";
      alert(msg);
      navigation.replace("Login");
      return;
    }

    const token = loginData.token;
    await AsyncStorage.setItem("userToken", token);

    // 3) Fetch membership info from custom endpoint (uses token)
    const memRes = await fetch(`${WP_BASE}/wp-json/ipcr/v1/membership`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let membership = {
      level_id: 0,
      level_name: "Free",
      enddate: null,
    };

    if (memRes.ok) {
      const memData = await memRes.json();
      membership = {
        level_id: memData.level_id ?? 0,
        level_name: memData.level_name ?? "Free",
        enddate: memData.enddate ?? null,
        user_id: memData.user_id ?? null,
        username: memData.username ?? username,
        email: memData.email ?? email,
        avatar: memData.avatar ?? null,
        name: memData.name ?? name,
      };

      const userObj = {
        token,
        user_id: membership.user_id,
        username: membership.username,
        email: membership.email,
        name: membership.name,
        avatar:
          membership.avatar ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        membership_level: membership.level_id,
        membership_name: membership.level_name,
        membership_expiry: membership.enddate,
      };
      await AsyncStorage.setItem("user", JSON.stringify(userObj));
    } else {
      // fallback if membership fails
      const fallbackUser = {
        token,
        user_id: null,
        username,
        email,
        name,
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        membership_level: 0,
        membership_name: "Free",
        membership_expiry: null,
      };
      await AsyncStorage.setItem("user", JSON.stringify(fallbackUser));
    }

    // 4) Redirect
    await handleRedirectAfterAuth();
  } catch (err) {
    console.error("Register/Login Error:", err);
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
      <View style={styles.header}>
        <Ionicons name="person-add-outline" size={48} color="green" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>
            Already have an account? <Text style={{ fontWeight: "bold" }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },
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
  registerButton: {
    backgroundColor: "green",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  registerButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { color: "green", fontSize: 14, textAlign: "center", marginTop: 8 },
});
