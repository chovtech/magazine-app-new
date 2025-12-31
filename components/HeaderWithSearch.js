import React, { useState, useContext } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationContext } from "../screens/NotificationContext"; // ✅ NEW

export default function HeaderWithSearch({ title }) {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const { notifications } = useContext(NotificationContext); // ✅ get notifications

  // compute unread notifications
  const notificationCount = notifications.filter((n) => !n.read).length;

  // Reload user data whenever this header's screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadUser = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser && isActive) {
            setUser(JSON.parse(storedUser));
          }
        } catch (e) {
          console.error("Error loading user:", e);
        }
      };
      loadUser();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Profile Image */}
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Image
            source={{
              uri:
                user?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.notificationWrapper}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color="black" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  notificationWrapper: {
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 20,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
