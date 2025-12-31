// DiscoverScreen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HeaderWithSearch from "../components/HeaderWithSearch";
import { getPosts, getPostById } from "../api/db"; // <-- getPostById added
import { refreshPostsInBackground } from "../api/wpApi";

export default function DiscoverScreen({ navigation, route }) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);

  // load user & membership info
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));

      const storedMembership = await AsyncStorage.getItem("membership");
      if (storedMembership) setMembership(JSON.parse(storedMembership));
    } catch (error) {
      console.error("Error loading user/membership:", error);
    }
  };

  // load posts from DB
  const loadFromDB = async () => {
    try {
      setLoading(true);
      const cachedPosts = await getPosts(50);

      // keep a lightweight formatted list for rendering, but don't remove membership fields
      const formatted = cachedPosts.map((post) => ({
        uniqueId: `db-${post.id}`,
        id: post.id,
        title: post.title,
        image: post.image || "https://via.placeholder.com/100",
        category: post.category || "General",
        author: post.author || "Unknown",
        content: post.content,
        date: post.date ? new Date(post.date).toDateString() : "",
        // include membership fields in case some logic needs it without a DB roundtrip
        membership_level: post.membership_level ?? 0,
        membership_expiry: post.membership_expiry ?? null,
        // optional helper
        isPremium: (post.membership_level ?? 0) === 2,
      }));
      setAllArticles(formatted);

      if (route.params?.category) {
        setSelectedCategory(route.params.category);
      }
    } catch (error) {
      console.error("Error loading from DB:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // mirror SavedScreen pattern: refresh when screen focuses
    const fetchData = async () => {
      await loadUser();
      await loadFromDB();
      // refresh in background and reload
      refreshPostsInBackground(50).then(() => loadFromDB());
    };

    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });

    // initial load
    fetchData();

    return unsubscribe;
  }, [navigation, route.params?.category]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPostsInBackground(50);
      await loadFromDB();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // categories
  const categories = useMemo(() => {
    const cats = allArticles.map((a) => a.category);
    return ["All", ...Array.from(new Set(cats))];
  }, [allArticles]);

  // filter
  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const matchSearch = article.title
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchText, selectedCategory, allArticles]);

  // ---- Important: fetch full post before navigating ----
  const handlePressItem = async (item) => {
    try {
      // If item already has membership_level, we can use it; otherwise fetch full row
      let fullPost = item;
      if (item.membership_level === undefined || item.membership_level === null) {
        const dbPost = await getPostById(item.id);
        if (dbPost) {
          fullPost = dbPost;
        }
      }

      // Debugging logs — remove if noisy
      console.log("Navigating to ArticleDetails with:", {
        id: fullPost.id,
        membership_level: fullPost.membership_level,
        membership_expiry: fullPost.membership_expiry,
      });

      navigation.navigate("ArticleDetails", { article: fullPost });
    } catch (err) {
      console.error("Failed to load full post, navigating with lightweight item:", err);
      navigation.navigate("ArticleDetails", { article: item });
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        item === selectedCategory && styles.categoryButtonSelected,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          item === selectedCategory && styles.categoryTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => handlePressItem(item)}
    >
      <Image source={{ uri: item.image }} style={styles.articleImage} />
      <View style={styles.articleInfo}>
        <Text style={styles.articleCategory}>{item.category}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.author && (
          <Text style={styles.articleAuthor}>By {item.author}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderWithSearch title="Discover" />

      <TextInput
        style={styles.searchInput}
        placeholder="Search articles..."
        value={searchText}
        onChangeText={setSearchText}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(_, index) => `cat-${index}`}
        renderItem={renderCategory}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => item.uniqueId}
          renderItem={renderArticle}
          contentContainerStyle={styles.articlesList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

// (styles unchanged — paste your existing styles here)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchInput: {
    height: 40,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
  },
  categoriesList: { paddingHorizontal: 12, marginBottom: 10 },
  categoryButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    height: 36,
  },
  categoryButtonSelected: { backgroundColor: "green" },
  categoryText: { color: "#555", fontWeight: "500", fontSize: 14 },
  categoryTextSelected: { color: "#fff" },
  articlesList: { paddingHorizontal: 12, paddingBottom: 40 },
  articleCard: {
    flexDirection: "row",
    marginVertical: 8,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
  },
  articleImage: { width: 100, height: 100 },
  articleInfo: { flex: 1, padding: 12, justifyContent: "center" },
  articleCategory: {
    fontSize: 12,
    color: "green",
    marginBottom: 4,
    fontWeight: "600",
  },
  articleTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  articleAuthor: { marginTop: 6, fontSize: 12, color: "#666" },
  loadingText: { textAlign: "center", marginTop: 6, fontSize: 14, color: "#888" },
  loadingContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 5,
  },
});
