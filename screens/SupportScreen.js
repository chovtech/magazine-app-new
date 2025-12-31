// SupportScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { syncSettings, getSettings } from "../api/storageService";

export default function SupportScreen({ navigation }) {
  const [supportContent, setSupportContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = Dimensions.get('window');

  // Clean HTML before rendering
  const cleanHTML = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/\\r\\n/g, "")   // remove line breaks
      .replace(/\\"/g, '"');    // unescape quotes
  };

  useEffect(() => {
    async function loadData() {
      const updated = await syncSettings();
      if (updated?.data?.support) {
        setSupportContent(cleanHTML(updated.data.support));
      } else {
        const stored = await getSettings();
        setSupportContent(cleanHTML(stored?.data?.support) || "<p>No Support Info available.</p>");
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
        <Text style={styles.header}>Support</Text>
        <Ionicons name="help-circle-outline" size={26} color="#333" />
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {supportContent ? (
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: supportContent }}
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
          <Text style={styles.text}>No Support Info available.</Text>
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
