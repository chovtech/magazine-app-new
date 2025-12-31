import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import SectionHeader from './SectionHeader';

export default function RecommendedList({ data, onSeeMore, onPressItem }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onPressItem(item)}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Image source={{ uri: item.authorImage }} style={styles.authorImage} />
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <SectionHeader title="Most Recent Post" onSeeMore={onSeeMore} />
      {data.length === 0 ? (
        <Text style={styles.emptyText}>Loading articles...</Text>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          horizontal={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  category: {
    fontSize: 12,
    color: 'grey',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  authorImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  author: {
    fontSize: 12,
    color: '#444',
    marginRight: 10,
  },
  dot: {
    fontSize: 14,
    color: '#888',
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#888',
    fontSize: 14,
  },
});
