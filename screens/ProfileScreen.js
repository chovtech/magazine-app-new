import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [allStorage, setAllStorage] = useState({});

  // Load user + all storage
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));

      const keys = await AsyncStorage.getAllKeys();
      const entries = await AsyncStorage.multiGet(keys);
      const storageObject = {};
      entries.forEach(([key, value]) => {
        try {
          storageObject[key] = JSON.parse(value);
        } catch {
          storageObject[key] = value;
        }
      });
      setAllStorage(storageObject);
    } catch (e) {
      console.error("Error loading storage:", e);
    }
  };

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadUser(); // ✅ Always refresh avatar + details

      // Only handle back for logged-in users
      if (!user || user.username === "guest") return;

      const onBackPress = () => {
        navigation.navigate("MainTabs");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [user])
  );

  // Guest view
  if (!user || user.username === "guest") {
    return (
      <View style={styles.guestContainer}>
        <Ionicons
          name="person-circle-outline"
          size={120}
          color="green"
          style={{ marginBottom: 20 }}
        />
        <Text style={styles.guestTitle}>Welcome, Guest!</Text>
        <Text style={styles.guestSubtitle}>
          Log in or register to access your profile.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => navigation.navigate("Registration")}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
        >
          <Text style={styles.continueButtonText}>Continue Reading</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Logged-in user view
  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: "create-outline",
          title: "Edit Profile",
          subtitle: "Update your personal information",
        },
        {
          icon: "log-out-outline",
          title: "Logout",
          subtitle: "Sign out from your account",
        },
        {
          icon: "trash-outline",
          title: "Delete Account",
          subtitle: "Permanently remove your account",
        },
      ],
    },
    {
      title: "Billing & Subscription",
      items: [
        {
          icon: "card-outline",
          title: "Subscription",
          subtitle: "Manage your subscription plan",
        },
        {
          icon: "close-circle-outline",
          title: "Cancel Billing",
          subtitle: "Stop your active subscription",
        },
        
      ],
    },
    { 
      title: 'Legal & Policies', 
      items: [ 
        { 
          icon: 'lock-closed-outline', 
          title: 'Privacy Policy', 
          subtitle: 'How we handle your data' 
        }, 
        { 
          icon: 'document-text-outline', 
          title: 'Terms And Conditions', 
          subtitle: 'Read our legal agreements' 
        }, 
      ], 
    }, 
    { 
      title: 'About', 
      items: [ 
        { 
          icon: 'people-outline', 
          title: 'About Us', 
          subtitle: 'Learn more about our company' 
        }, 
        { 
          icon: 'information-circle-outline', 
          title: 'App Info', 
          subtitle: 'Version, build & details' 
        }, 
        
      ], 
    }, 
    { 
      title: 'Help & Support', 
      items: [ 
        { 
          icon: 'call-outline', 
          title: 'ContactUs', 
          subtitle: 'Get in touch with our team' 
        }, 
        { 
          icon: 'headset-outline', 
          title: 'Support', 
          subtitle: '24/7 customer service' 
        },
           { 
            icon: 'business-outline', 
            title: 'Partnerships', 
            subtitle: 'Work with us' 
          }, 
        ], 
      },



  ];

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageWrapper}>
          <Image
            source={{
              uri:
                user?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.profileImage}
          />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "No email saved"}</Text>
        </View>
      </View>

      {/* Menu List */}
      <ScrollView style={styles.scroll}>
        {menuSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                onPress={() => {
                  if (item.title === "Logout") navigation.navigate("Logout");
                  else navigation.navigate(item.title.replace(/\s+/g, ""));
                  
                }}
              >
                <View style={styles.menuLeft}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color="green"
                    style={styles.menuIcon}
                  />
                  <View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Debug: Show all storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Local Storage Data</Text>
          {Object.entries(allStorage).map(([key, value]) => (
            <View key={key} style={styles.storageItem}>
              <Text style={styles.storageKey}>{key}</Text>
              <Text style={styles.storageValue}>
                {JSON.stringify(value, null, 2)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImageWrapper: {
    position: "relative",
    width: "35%",
    alignItems: "center",
  },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  profileInfo: { flex: 1, justifyContent: "center", paddingLeft: 15 },
  userName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  userEmail: { fontSize: 14, color: "#777", marginVertical: 6 },
  scroll: { paddingHorizontal: 20 },
  section: { marginTop: 25 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  menuItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuIcon: { marginRight: 12 },
  menuTitle: { fontSize: 14, fontWeight: "bold", color: "#333" },
  menuSubtitle: { fontSize: 12, color: "#777" },
  storageItem: {
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
  },
  storageKey: { fontWeight: "bold", color: "#222" },
  storageValue: { fontSize: 12, color: "#444" },

  // Guest styles
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 25,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    alignItems: "center",
  },
  loginButton: { backgroundColor: "green" },
  registerButton: { backgroundColor: "#ddd" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  continueReading: { marginTop: 10, fontSize: 14, color: "#555" },

  continueButton: {
    marginTop: 1,
    borderColor: "green",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  continueButtonText: { color: "green", fontSize: 18, fontWeight: "600" },
});
