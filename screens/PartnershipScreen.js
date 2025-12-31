// PartnershipScreen.js
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { syncSettings, getSettings } from "../api/storageService";

export default function PartnershipScreen({ navigation }) {
  const [partnershipContent, setPartnershipContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = Dimensions.get('window');

  // Clean HTML before rendering
  const cleanHTML = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/\\r\\n/g, "")
      .replace(/\\"/g, '"');
  };

  useEffect(() => {
    async function loadData() {
      const updated = await syncSettings();
      if (updated?.data?.partnership) {
        setPartnershipContent(cleanHTML(updated.data.partnership));
      } else {
        const stored = await getSettings();
        setPartnershipContent(cleanHTML(stored?.data?.partnership) || "<p>No Partnership Info available.</p>");
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Partnership</Text>
        <Ionicons name="handshake-outline" size={26} color="#333" />
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {partnershipContent ? (
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: partnershipContent }}
            tagsStyles={{
              h1: { fontSize: 22, fontWeight: "bold", marginVertical: 10, color: "#222" },
              h2: { fontSize: 18, fontWeight: "bold", marginTop: 12, marginBottom: 6, color: "#444" },
              p: { fontSize: 14, lineHeight: 22, color: "#555", marginBottom: 10 },
              strong: { fontWeight: "bold", color: "#000" },
              ul: { marginVertical: 8, paddingLeft: 20 },
              li: { fontSize: 14, lineHeight: 22, color: "#555" }
            }}
          />
        ) : (
          <Text style={styles.text}>No Partnership Info available.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { padding: 5 },
  header: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#333' },
  text: { fontSize: 16, marginBottom: 15, color: '#444' },
});
