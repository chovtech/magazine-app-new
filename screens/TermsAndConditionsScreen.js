import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { syncSettings, getSettings } from "../api/storageService";

export default function TermsAndConditionScreen({ navigation }) {
  const [termsContent, setTermsContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = Dimensions.get('window');

  // clean HTML from API
  const cleanHTML = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/\\r\\n/g, "")   // remove line breaks
      .replace(/\\"/g, '"');    // unescape quotes
  };

  useEffect(() => {
    async function loadData() {
      // Try to sync with API
      const updated = await syncSettings();
      if (updated?.data?.terms) {
        setTermsContent(cleanHTML(updated.data.terms));
      } else {
        // fallback: just get from storage
        const stored = await getSettings();
        setTermsContent(cleanHTML(stored?.data?.terms) || "<p>No Terms & Conditions found.</p>");
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
      {/* Top Header with Back Arrow + Legal Icon */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.header}>Terms & Conditions</Text>

        <Ionicons name="document-text-outline" size={24} color="#333" />
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {termsContent ? (
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: termsContent }}
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
          <Text style={styles.paragraph}>No Terms & Conditions available.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 10 },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  backButton: { padding: 5 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  paragraph: { fontSize: 14, lineHeight: 22, color: '#555', marginTop: 6 },
});
