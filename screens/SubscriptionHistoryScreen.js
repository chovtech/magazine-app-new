import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function SubscriptionHistoryScreen() {
  // Dummy subscription history (replace with API data later)
  const subscriptionData = [
    { id: '1', plan: 'Premium Plan', amount: '$19.99', date: '2025-09-01', status: 'Active' },
    { id: '2', plan: 'Basic Plan', amount: '$9.99', date: '2025-08-01', status: 'Expired' },
    { id: '3', plan: 'Trial Plan', amount: '$0.00', date: '2025-07-01', status: 'Expired' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View>
        <Text style={styles.plan}>{item.plan}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text
          style={[
            styles.status,
            { color: item.status === 'Active' ? 'green' : 'gray' }
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription History</Text>
      <FlatList
        data={subscriptionData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  plan: { fontSize: 16, fontWeight: '600', color: '#222' },
  date: { fontSize: 12, color: '#666' },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  status: { fontSize: 12, marginTop: 4 },
});
