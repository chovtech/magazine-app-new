import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationContext } from "./NotificationContext";

export default function NotificationScreen({ navigation }) {
  const { notifications, saveNotifications } = useContext(NotificationContext);

  // --- CRUD actions ---
  const markAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const toggleRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: !n.read } : n
    );
    saveNotifications(updated);
  };

  const removeNotification = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => saveNotifications([]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity onPress={clearAll}>
          <Ionicons name="trash-outline" size={22} color="red" />
        </TouchableOpacity>
      </View>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              {!item.read && <View style={styles.unreadDot} />}
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="green"
                style={styles.icon}
              />

              <View style={styles.textWrapper}>
                <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                  {item.title}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
                {item.body ? (
                  <Text
                    style={{ color: "#444", marginTop: 4 }}
                    numberOfLines={2}
                  >
                    {item.body}
                  </Text>
                ) : null}
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Toggle Read/Unread */}
                <TouchableOpacity
                  onPress={() => toggleRead(item.id)}
                  style={{ marginRight: 10 }}
                >
                  <Ionicons
                    name={item.read ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={item.read ? "#999" : "#4CAF50"}
                  />
                </TouchableOpacity>

                {/* Open */}
                <TouchableOpacity
                  onPress={() => {
                    markAsRead(item.id);
                    navigation.navigate("NotificationDetail", {
                      notification: item,
                    });
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => removeNotification(item.id)}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { marginRight: 10 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    color: "#333",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    fontStyle: "italic",
  },
  notificationItem: { flexDirection: "row", alignItems: "center", padding: 12 },
  icon: { marginRight: 12 },
  textWrapper: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: "#222" },
  unreadTitle: { fontWeight: "bold", color: "#000" },
  time: { fontSize: 12, color: "#666", marginTop: 3 },
  separator: { height: 1, backgroundColor: "#eee", marginVertical: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "green",
    marginRight: 6,
  },
});
