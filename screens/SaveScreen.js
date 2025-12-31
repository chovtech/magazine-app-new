import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import HeaderWithSearch from '../components/HeaderWithSearch';
import { getSavedPosts } from "../api/db"; // Import DB function

export default function SaveScreen({ navigation }) {
  const [savedArticles, setSavedArticles] = useState([]);

  // Fetch saved posts from SQLite
  useEffect(() => {
    const fetchSavedArticles = async () => {
      try {
        const posts = await getSavedPosts();
        setSavedArticles(posts);
      } catch (err) {
        console.error("Failed to fetch saved articles:", err);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchSavedArticles(); // refresh every time screen is focused
    });

    return unsubscribe;
  }, [navigation]);

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => navigation.navigate('ArticleDetails', { article: item })}
    >
      <Image source={{ uri: item.image }} style={styles.articleImage} />
      <View style={styles.articleInfo}>
        <Text style={styles.articleCategory}>{item.category}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.author && <Text style={styles.articleAuthor}>By {item.author}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderWithSearch title="Saved" />

      <FlatList
        data={savedArticles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderArticle}
        contentContainerStyle={styles.articlesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No saved articles yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  articlesList: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  articleCard: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  articleCategory: {
    fontSize: 12,
    color: 'green',
    marginBottom: 4,
    fontWeight: '600',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  articleAuthor: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
