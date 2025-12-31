import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { initDB } from "./api/db";
import Constants from "expo-constants";
import { NotificationProvider } from "./screens/NotificationContext";
import UpdateModal from "./screens/UpdateModal";
import { safeFetch } from "./utils/fetchWrapper";
import Purchases from "react-native-purchases";

function MainApp() {
  const [dbReady, setDbReady] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("");

  useEffect(() => {
    async function setup() {
      try {
        // ✅ Initialize local DB
        await initDB();
        setDbReady(true);
      } catch (err) {
        Alert.alert("Database Error", String(err));
      }

      // ✅ Version check with safeFetch
      try {
        const data = await safeFetch(
          "https://contemporaryworld.ipcr.gov.ng/wp-json/app-update/v1/version"
        );

        const latestVersion = data.latestVersion;
        const storeUrl = data.url;

        if (Constants.expoConfig.version !== latestVersion) {
          setUpdateUrl(storeUrl);
          setForceUpdate(true);
          console.log("latest", latestVersion);
          console.log("config version", Constants.expoConfig.version);
        }
      } catch (error) {
        console.log("⚠️ Version check failed", error.message);
      }

      // ✅ Initialize RevenueCat once
      try {
        await Purchases.configure({
          apiKey: "goog_GbBsxPvQBsvjnRqxuttXrttBNYW",
        });
        console.log("🟢 RevenueCat initialized successfully");
      } catch (error) {
        console.log("🚨 RevenueCat initialization failed:", error);
      }
    }

    setup();
  }, []);

  if (!dbReady) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.statusBarBackground} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.statusBarBackground} />

        {/* 🚨 Force Update Modal */}
        <UpdateModal visible={forceUpdate} updateUrl={updateUrl} />

        <AppNavigator />

        <StatusBar style="light" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.statusBarBackground} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <NotificationProvider>
      <MainApp />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E0316" },
  statusBarBackground: {
    height: StatusBar.currentHeight || 24,
    backgroundColor: "#0E0316",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E0316",
  },
});
