import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DeleteAccountScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const storedUser = await AsyncStorage.getItem("user");
              if (!storedUser) {
                Alert.alert("Error", "You must be logged in.");
                return;
              }

              const { token } = JSON.parse(storedUser);

              const response = await fetch(
                "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/delete-account",
                {
                  method: "DELETE",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              let data = {};
              try {
                data = await response.json();
              } catch (e) {
                console.warn("Non-JSON response on delete:", e);
              }

              if (!response.ok || !data.success) {
                Alert.alert("Error", data?.message || "Failed to delete account.");
                return;
              }

              // Clear all local storage
              await AsyncStorage.clear();

              // Reset navigation to Login (prevents going back)
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });

              Alert.alert("Account Deleted", "Your account has been permanently removed.");
            } catch (err) {
              console.error("Delete error:", err);
              Alert.alert("Error", "Something went wrong. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => !loading && navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <Ionicons name="trash-outline" size={24} color="red" />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>Permanently Delete Account</Text>
        <Text style={styles.subtitle}>
          Deleting your account will remove all your data, membership and profile photo permanently. This cannot be undone.
        </Text>

        <TouchableOpacity
          style={[styles.deleteButton, loading && { opacity: 0.6 }]}
          onPress={handleDelete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteText}>Delete My Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  body: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#c00", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 30 },
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
