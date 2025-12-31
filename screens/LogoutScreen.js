import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";

export default function LogoutScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("user");

      const guestUser = {
        username: "guest",
        name: "Guest User",
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        membership_level: 0,
      };
      await AsyncStorage.setItem("user", JSON.stringify(guestUser));

      // Reset stack to MainTabs only
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
      <View style={styles.body}>
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
    </View>
  );
}

// styles unchanged (use your previous styles)


// styles unchanged (use your previous styles)


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  body: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  title: { fontSize: 20, fontWeight: "bold", color: "#222", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#777", textAlign: "center", marginBottom: 35, paddingHorizontal: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginHorizontal: 6, elevation: 1 },
  cancelButton: { backgroundColor: "#ddd" },
  logoutButton: { backgroundColor: "green" },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#333" },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
