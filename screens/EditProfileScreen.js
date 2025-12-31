import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

export default function EditProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  // form state (we're using single fullName per your request)
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);

  // password handling
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);

          setEmail(parsed.email || "");
          setDisplayName(parsed.name || parsed.username || "");
          setFullName(parsed.first_name || parsed.name || "");
          setAvatar(parsed.avatar || null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    loadProfile();
  }, []);

  // helper: extract file extension and mime type from URI
  const getFileInfo = (uri) => {
    try {
      const cleanUri = uri.split("?")[0];
      const parts = cleanUri.split(".");
      const ext = parts[parts.length - 1].toLowerCase();
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
      const name = `avatar_${Date.now()}.${ext}`;
      return { name, type: mime };
    } catch (e) {
      return { name: `avatar_${Date.now()}.jpg`, type: "image/jpeg" };
    }
  };

  // PICK + UPLOAD avatar
  const pickAndUploadImage = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8, // initial compression
    });

    if (result.canceled) return;

    let asset = result.assets[0];
    if (!asset?.uri) {
      Alert.alert("Error", "No image selected.");
      return;
    }

    setLoading(true);

    // ✅ Further compress + resize before upload
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1080 } }], // scale down if larger
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // ✅ Check file size (in MB)
    const fileInfo = await fetch(manipulated.uri);
    const blob = await fileInfo.blob();
    const fileSizeMB = blob.size / (1024 * 1024);

    if (fileSizeMB > 2) {
      Alert.alert("Image too large", "Please select a smaller image (max 2MB).");
      setLoading(false);
      return;
    }

    const storedUser = await AsyncStorage.getItem("user");
    if (!storedUser) {
      Alert.alert("Error", "You must be logged in");
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const token = parsedUser.token;

    const fileUri = manipulated.uri;
    const fileExt = fileUri.split(".").pop().toLowerCase() || "jpg";
    const mime =
      fileExt === "jpg" || fileExt === "jpeg"
        ? "image/jpeg"
        : `image/${fileExt}`;
    const fileName = `avatar_${Date.now()}.${fileExt}`;

    const formData = new FormData();
    formData.append("avatar", { uri: fileUri, type: mime, name: fileName });

    const response = await fetch(
      "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/update-avatar",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ RN sets Content-Type
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Upload response:", data);
      Alert.alert("Upload failed", data?.message || "Failed to upload image");
      setLoading(false);
      return;
    }

    const newAvatar = data.avatar_url;

    const updatedUser = { ...parsedUser, avatar: newAvatar };
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

    setUser(updatedUser);
    setAvatar(newAvatar);

    Alert.alert("Success", "Profile photo updated!");
  } catch (err) {
    console.error("Avatar update error:", err);
    Alert.alert("Error", "Something went wrong while updating avatar");
  } finally {
    setLoading(false);
  }
};


  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert("Error", "You must be logged in to update profile");
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const token = parsedUser.token;

      if (!token) {
        Alert.alert("Error", "Invalid user session");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/update-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: fullName, // treating fullName as first_name on WP
            display_name: displayName,
            email: email,
            current_password: currentPassword || undefined,
            new_password: newPassword || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data?.message || "Something went wrong");
        setLoading(false);
        return;
      }

      // update local storage while preserving token and other fields
      const updatedUser = {
        ...parsedUser,
        email: email,
        name: displayName || fullName,
        first_name: fullName,
        avatar: avatar || parsedUser.avatar,
      };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>

          {/* Profile Image with camera icon */}
          <View style={styles.imageWrapper}>
            <Image source={{ uri: avatar || "https://via.placeholder.com/120x120.png?text=No+Image" }} style={styles.profileImage} />
            <TouchableOpacity style={styles.editIcon} onPress={pickAndUploadImage} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="camera" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Header Info */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{fullName || displayName || user?.username}</Text>
            <Text style={{ fontSize: 14, color: "#555" }}>{email}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />

            <Text style={styles.label}>Display Name</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Enter your display name" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Enter your email" />

            <Text style={styles.label}>Current Password</Text>
            <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Enter current password" />

            <Text style={styles.label}>New Password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Enter new password" />

            <Text style={styles.label}>Confirm New Password</Text>
            <Text style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Re-enter new password" />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { marginRight: 10, padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  imageWrapper: { alignSelf: "center", justifyContent: "center", alignItems: "center", marginBottom: 10, position: "relative", width: 120, height: 120 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  editIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "green", borderRadius: 20, padding: 6, borderWidth: 2, borderColor: "#fff" },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 15, color: "#333" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginTop: 6, fontSize: 16 },
  footer: { padding: 20, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "#fff" },
  saveButton: { backgroundColor: "green", paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
