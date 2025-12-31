// NotificationDetail.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationDetail({ route, navigation }) {
  const { notification } = route.params || {};

  if (!notification) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No notification details found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Notification</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <Text style={styles.title}>{notification.title || "Notification"}</Text>
        {notification.time && (
          <Text style={styles.time}>Received at: {notification.time}</Text>
        )}
        {notification.body ? (
          <Text style={styles.body}>{notification.body}</Text>
        ) : (
          <Text style={styles.body}>No message content</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: { flexDirection: "row", alignItems: "center", padding: 12 },
  backButton: { marginRight: 10 },
  header: { fontSize: 18, fontWeight: "bold", color: "#333" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#111" },
  time: { fontSize: 14, color: "#666", marginBottom: 20 },
  body: { fontSize: 16, lineHeight: 22, color: "#444" },
  error: { textAlign: "center", marginTop: 50, color: "red", fontSize: 16 },
});
