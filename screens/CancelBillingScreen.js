import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CancelBillingScreen({ navigation }) {
  const handleManageSubscription = () => {
    // Open App Store / Play Store subscription management
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Error", "Unable to open subscription page.");
      })
      .catch((err) => console.error("An error occurred", err));
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#2a5298" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Manage Subscription</Text>

        <TouchableOpacity onPress={() => Alert.alert("Info", "Need help? Contact support.")}>
          <Ionicons name="information-circle-outline" size={24} color="#2a5298" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          To cancel or upgrade your subscription, please manage it directly in your App Store or Play Store account. 
        </Text>

        <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
          <Text style={styles.manageText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  iconButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#2a5298" },
  content: { flex: 1, justifyContent: "center" },
  subtitle: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 35,
    textAlign: "center",
  },
  manageButton: {
    backgroundColor: "#2a5298",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  manageText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
