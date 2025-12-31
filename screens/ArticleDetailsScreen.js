import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RenderHTML from "react-native-render-html";
import { updateSaveStatus, getPostById } from "../api/db";
import { getUserToken } from "../api/storageService";
import { getUserSubscription } from "../utils/membershipService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function ArticleDetailsScreen({ route, navigation }) {
  const { article } = route.params || {};
  const { width } = useWindowDimensions();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Load user + subscription when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchSession = async () => {
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          console.log("🧩 All storage keys:", allKeys);

          const token = await getUserToken();
          const sub = await getUserSubscription();
          setIsLoggedIn(!!token);
          setSubscription(sub);
          console.log("🔁 Refreshed subscription:", sub);
        } catch (err) {
          console.error("Failed to fetch session info:", err);
        }
      };
      fetchSession();
    }, [])
  );

  // Load current saved status from DB
  useEffect(() => {
    const fetchSavedStatus = async () => {
      if (!article?.id) return;
      try {
        const post = await getPostById(article.id);
        setIsSaved(post?.saved === 1);
      } catch (err) {
        console.error("Failed to fetch save status:", err);
      }
    };
    fetchSavedStatus();
  }, [article]);

  const toggleSave = async () => {
    if (!article?.id) return;
    try {
      const newStatus = !isSaved;
      await updateSaveStatus(article.id, newStatus);
      setIsSaved(newStatus);
      Alert.alert(
        newStatus ? "Saved" : "Removed",
        `Article has been ${newStatus ? "saved" : "removed"} successfully.`
      );
    } catch (err) {
      console.error("Failed to update save status:", err);
    }
  };

  // ---- Access Logic ----
  console.log("🧾 Subscription from storage:", subscription);
  let accessState = "allowed";

  const level = subscription?.membership_level || "0";
  let expiry = subscription?.membership_expiry || 0;

  // Normalize expiry to milliseconds
  expiry = Number(expiry);
  if (expiry && expiry < 2_000_000_000) expiry *= 1000;

  const hasActiveSub = level === "2" && expiry > Date.now();

  if (article?.membership_level === 1 && !isLoggedIn) {
    accessState = "loginRequired";
  } else if (article?.membership_level === 2) {
    if (!isLoggedIn) {
      accessState = "loginRequired";
    } else if (!hasActiveSub) {
      accessState = "subscriptionRequired";
    }
  }

  // ---- Show Teaser ----
  const getTeaser = (html) => {
    if (!html) return "";
    const plainText = html.replace(/<[^>]+>/g, "");
    const teaser = plainText.substring(0, 200);
    return `<p>${teaser}...</p>`;
  };

  const renderAccessBlock = () => {
    if (accessState === "loginRequired") {
      return (
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedText}>
            Login required to read the full article.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.ctaText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (accessState === "subscriptionRequired") {
      return (
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedText}>
            This is premium content. Subscribe to continue.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.ctaText}>Go to Subscription</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail news</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>{article?.title || "Untitled Post"}</Text>

      {/* Meta Info */}
      <View style={styles.metaRow}>
        <Text style={styles.category}>{article?.category || "General"}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.date}>{article?.date || "Unknown Date"}</Text>
      </View>

      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri:
              article?.image ||
              "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
          }}
          style={styles.image}
        />
      </View>

      {/* Author Row + Save Icon */}
      <View style={styles.authorRow}>
        <Image
          source={{
            uri:
              article?.authorImage ||
              "https://randomuser.me/api/portraits/men/1.jpg",
          }}
          style={styles.authorImage}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {article?.author || "Unknown Author"}
          </Text>
          <Text style={styles.followers}>Contributor</Text>
        </View>

        {/* Save Icon */}
        <TouchableOpacity onPress={toggleSave}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isSaved ? "#FF4500" : "#333"}
          />
        </TouchableOpacity>
      </View>

      {/* ---- Content / Restricted Access ---- */}
      {accessState !== "allowed" ? (
        <>
          {article?.content ? (
            <RenderHTML
              contentWidth={width}
              source={{ html: getTeaser(article.content) }}
              tagsStyles={{
                p: { fontSize: 15, lineHeight: 22, color: "#333" },
              }}
            />
          ) : (
            <Text style={styles.body}>No preview available.</Text>
          )}
          {renderAccessBlock()}
        </>
      ) : (
        <>
          {article?.content ? (
            <RenderHTML
              contentWidth={width}
              source={{ html: article.content }}
              tagsStyles={{
                p: {
                  fontSize: 15,
                  lineHeight: 22,
                  color: "#333",
                  marginBottom: 12,
                },
                h2: {
                  fontSize: 18,
                  fontWeight: "bold",
                  marginVertical: 10,
                },
                img: { borderRadius: 8, marginVertical: 10 },
              }}
            />
          ) : (
            <Text style={styles.body}>No content available.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", marginVertical: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  category: { color: "#FF4500", fontWeight: "500" },
  dot: { marginHorizontal: 6, color: "#888" },
  date: { color: "#555" },
  imageWrapper: { position: "relative", marginBottom: 12 },
  image: { width: "100%", height: 200, borderRadius: 12 },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  authorImage: { width: 40, height: 40, borderRadius: 20 },
  authorInfo: { flex: 1, marginHorizontal: 10 },
  authorName: { fontSize: 14, fontWeight: "600" },
  followers: { fontSize: 12, color: "#888" },
  body: { fontSize: 14, lineHeight: 20, color: "#333", marginBottom: 30 },
  blockedContainer: { padding: 20, alignItems: "center" },
  blockedText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 12,
    color: "#444",
  },
  ctaButton: {
    backgroundColor: "#FF4500",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
