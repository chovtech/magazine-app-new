// screens/UpdateModal.js
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";

export default function UpdateModal({ visible, updateUrl }) {
  if (!visible) return null; // ✅ still keep this so modal only shows when needed

  const handleUpdate = () => {
    if (updateUrl) {
      Linking.openURL(updateUrl);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            A newer version of this app is available. You must update to continue.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
          {/* ❌ Removed the "Later" button so user is forced to update */}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontWeight: "bold" },
});
