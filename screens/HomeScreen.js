import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import HeaderWithSearch from "../components/HeaderWithSearch";
import TrendingCarousel from "../components/TrendingCarousel";
import RecommendedList from "../components/RecommendedList";
import CategoriesScroll from "../components/CategoriesScroll";
import { getPosts } from "../api/db";
import { refreshPostsInBackground } from "../api/wpApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  const [recommendedData, setRecommendedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("For You");
  const [allPosts, setAllPosts] = useState([]);

  // load posts from DB
  const loadFromDB = async () => {
    try {
      setLoading(true);
      const cachedPosts = await getPosts(20);

      setAllPosts(cachedPosts);

      if (activeCategory === "For You") {
        setRecommendedData(cachedPosts);
      } else {
        const filtered = cachedPosts.filter(
          (p) => p.category === activeCategory
        );
        setRecommendedData(filtered);
      }
    } catch (error) {
      console.error("Error loading from DB:", error);
    } finally {
      setLoading(false);
    }
  };

  // load user
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error loading user:", e);
    }
  };

  // initial load
  useEffect(() => {
    loadFromDB();
    loadUser();
    refreshPostsInBackground(20).then(() => loadFromDB());
  }, [activeCategory]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPostsInBackground(20);
      await loadFromDB();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePressItem = (item) => {
    navigation.navigate("ArticleDetails", { article: item });
  };

  // build dynamic categories
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(allPosts.map((p) => p.category)));
    return ["For You", ...uniqueCats];
  }, [allPosts]);

  const renderHeader = () => (
    <>
      <HeaderWithSearch title="Home" />

      {/* Greeting */}
      {/* <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>
          {user?.name ? `Hey, ${user.name}` : "Hey, welcome"}
        </Text>
      </View> */}

      {/* Category Scroll */}
      <CategoriesScroll
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Trending */}
      <TrendingCarousel onPressItem={handlePressItem} />

      {/* Recommended List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="green" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : (
        <RecommendedList
          data={recommendedData}
          onSeeMore={() => navigation.navigate("DiscoverScreen")}
          onPressItem={handlePressItem}
        />
      )}
    </>
  );

  return (
    <FlatList
      data={[{ key: "home-header" }]}
      ListHeaderComponent={renderHeader}
      keyExtractor={(item) => item.key}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff" },
  greetingContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  greetingText: { fontSize: 20, fontWeight: "600", color: "#222" },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: { marginTop: 6, fontSize: 14, color: "#888" },
});
