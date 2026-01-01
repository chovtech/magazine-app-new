import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases from "react-native-purchases";
import { fetchMembership, getUserMembership } from "../utils/membershipService";

const ORDERS_API = "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/orders";

export default function PaymentScreen({ navigation }) {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const memData = await fetchMembership();
        if (!memData) {
          const storedMem = await getUserMembership();
          setMembership(storedMem);
        } else {
          setMembership(memData);
        }

        await fetchOrders();
      } catch (err) {
        console.error("Error loading membership:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

 const fetchOrders = async () => {
  setLoadingOrders(true);
  try {
    // Get stored user
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user?.email || !user?.auth?.password) {
      console.warn("No email/password found for user.");
      setOrders([]);
      return;
    }

    // Send email + password in request body
    const res = await fetch(ORDERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        password: user.auth.password,
      }),
    });

    if (!res.ok) {
      console.log("Order fetch failed:", res.status);
      setOrders([]);
      return;
    }

    const data = await res.json();

    // Normalize response
    if (data?.success && Array.isArray(data.orders)) {
      setOrders(data.orders);
    } else {
      setOrders([]);
    }
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    setOrders([]);
  } finally {
    setLoadingOrders(false);
  }
};


  const handleSubscribe = async () => {
    try {
      setProcessing(true);

      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        Alert.alert("Unavailable", "No subscription packages available at the moment.");
        return;
      }

      const packageToBuy = offerings.current.availablePackages[0];
      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

      const premiumEntitlement = customerInfo.entitlements.active["magazine_quarterly"];
      if (!premiumEntitlement) {
        Alert.alert("Error", "No valid entitlement found.");
        return;
      }

      const expiry = premiumEntitlement.expirationDate;
      const receipt = JSON.stringify(customerInfo);
      const level_id = 2;

      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) {
        Alert.alert("Error", "User not logged in.");
        return;
      }
      const user = JSON.parse(userStr);
      const token = user?.auth?.token;
      if (!token) {
        Alert.alert("Error", "User not logged in.");
        return;
      }

      const response = await fetch(
        "https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/update-subscription",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ level_id, expiry, receipt }),
        }
      );

      const result = await response.json();

      if (result.success && result.membership) {
        user.membership = {
          level_id: result.membership.level_id,
          level_name: result.membership.level_name,
          enddate: result.membership.enddate,
        };
        await AsyncStorage.setItem("user", JSON.stringify(user));
        setMembership(user.membership);

        Alert.alert("Success", "Your Premium plan has been activated!");
        fetchOrders();
      } else {
        Alert.alert("Error", result.message || "Failed to update subscription.");
      }
    } catch (e) {
      if (!e.userCancelled) Alert.alert("Purchase Error", e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2a5298" />
      </View>
    );
  }

  const now = new Date();
  let planTitle = membership?.level_name || "Free";
  let statusText = "No active plan";
  let isActive = false;

  if (membership?.level_id === 1) {
    planTitle = "Free";
    statusText = "You're currently on the Free plan.";
  }

  if (membership?.level_id === 2) {
    if (membership.enddate) {
      const expiry = new Date(
        membership.enddate < 2000000000 ? membership.enddate * 1000 : membership.enddate
      );
      if (expiry.getTime() > now.getTime()) {
        isActive = true;
        statusText = `Your plan is active till ${expiry.toDateString()}.`;
      } else {
        statusText = `Your plan expired on ${expiry.toDateString()}.`;
      }
    } else {
      statusText = "No active subscription found.";
    }
  }

  const actionLabel = isActive ? "Active Plan" : "Subscribe";

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Subscription</Text>
        <Ionicons name="newspaper-outline" size={28} color="#333" />
      </View>

      <View style={styles.card}>
        <Text style={styles.planTitle}>{planTitle}</Text>
        <Text style={[styles.status, isActive && { color: "#2a5298", fontWeight: "600" }]}>
          {statusText}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, (processing || isActive) && { opacity: 0.6 }]}
        onPress={handleSubscribe}
        disabled={processing || isActive}
      >
        {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{actionLabel}</Text>}
      </TouchableOpacity>

      <Text style={styles.note}>Purchases are securely handled via Play Store / App Store.</Text>

      <View style={{ marginTop: 40 }}>
        <Text style={styles.orderHeader}>Order History</Text>
        {loadingOrders ? (
          <ActivityIndicator color="#2a5298" style={{ marginTop: 10 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.noOrders}>No orders found.</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isPaid =
                item.status?.toLowerCase() === "success" || item.status?.toLowerCase() === "paid";
              const formattedAmount = Number(item.total).toLocaleString("en-NG", {
                style: "currency",
                currency: "NGN",
              });
              const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <View style={styles.orderCard}>
                  <View style={styles.orderRow}>
                    <View>
                      <Text style={styles.orderTitle}>{item.membership_name}</Text>
                      <Text style={styles.orderMeta}>{formattedDate}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isPaid ? "#d1fae5" : "#fee2e2" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: isPaid ? "#065f46" : "#991b1b" },
                          ]}
                        >
                          {item.status?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.orderMeta, { marginTop: 4, fontWeight: "600", color: "#333" }]}>
                        {formattedAmount}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

// ---------------- Styles ----------------

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#222" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  planTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 10 },
  status: { fontSize: 14, color: "#666", lineHeight: 20 },
  actionButton: {
    backgroundColor: "#2a5298",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  note: { fontSize: 12, color: "#777", marginTop: 15, textAlign: "center" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  orderHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderTitle: { fontSize: 16, fontWeight: "600", color: "#222" },
  orderMeta: { fontSize: 13, color: "#555", marginTop: 3 },
  statusBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
