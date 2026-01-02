import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy"; // ✅ use legacy to avoid deprecation

export default function LogoutScreen({ navigation }) {

  const handleLogout = async () => {
    try {
      // 1️⃣ Remove user auth
      await AsyncStorage.removeItem("user");

      // 2️⃣ Delete the SQLite database file
      const dbFile = `${FileSystem.documentDirectory}SQLite/magazine.db`;
      const fileInfo = await FileSystem.getInfoAsync(dbFile);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbFile);
        console.log("✅ SQLite database deleted temporarily");
      } else {
        console.log("ℹ️ SQLite file does not exist, nothing to delete");
      }

      // 3️⃣ Reset navigation
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        })
      );

    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="log-out-outline" size={90} color="green" style={{ marginBottom: 25 }} />
      <Text style={styles.title}>Are you sure you want to logout?</Text>
      <Text style={styles.subtitle}>You will need to log in again to access your account.</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 20, fontWeight: "bold", color: "#222", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#777", textAlign: "center", marginBottom: 35 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginHorizontal: 6 },
  cancelButton: { backgroundColor: "#ddd" },
  logoutButton: { backgroundColor: "green" },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#333" },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
