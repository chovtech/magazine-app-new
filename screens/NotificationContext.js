import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // 📥 Load saved notifications on startup
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("notifications");
        if (stored) setNotifications(JSON.parse(stored));
      } catch (err) {
        console.error("❌ Error loading notifications:", err);
      }
    })();
  }, []);

  // 🔔 Local notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((event) => {
      const { title, body, data } = event.request.content;

      const newItem = {
        id: `${Date.now()}`,
        title: title || "Notification",
        body: body || "",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        data: data || {},
        read: false,
      };

      saveNotifications([newItem, ...notifications]);
    });

    return () => {
      subscription.remove();
    };
  }, [notifications]);

  // 💾 Save notifications anytime they change
  const saveNotifications = async (newList) => {
    try {
      setNotifications(newList);
      await AsyncStorage.setItem("notifications", JSON.stringify(newList));
    } catch (err) {
      console.error("❌ Error saving notifications:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        saveNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
