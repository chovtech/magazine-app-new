const handleSubscribe = async () => {
  try {
    setProcessing(true);

    // ✅ Fetch available offerings
    const offerings = await Purchases.getOfferings();

    if (offerings.current && offerings.current.availablePackages.length > 0) {
      const packageToBuy = offerings.current.availablePackages[0];

      // ✅ Start purchase
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToBuy);

      // ✅ Check entitlement (replace "premium" with your actual entitlement ID from RevenueCat)
      const premiumEntitlement = customerInfo.entitlements.active["magazine_quarterly"];
      if (premiumEntitlement) {

        const expiry = premiumEntitlement.expirationDate; // ISO string
        const receipt = JSON.stringify(customerInfo); // ✅ full RevenueCat customer info


        // ✅ Map entitlement → PMPro level_id (example: premium → 2)
        const level_id = 2;

        // ✅ Send to your WordPress endpoint
        const token = await AsyncStorage.getItem("userToken");
        const response = await fetch("https://contemporaryworld.ipcr.gov.ng/wp-json/ipcr/v1/update-subscription", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            level_id,
            expiry,
            receipt,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // ✅ Refresh membership after backend update
          let updated = await fetchMembership();
          setMembership(updated);
          Alert.alert("Success", "You are now subscribed!");
        } else {
          Alert.alert("Error", result.message || "Failed to update subscription.");
        }
      }
    } else {
      Alert.alert("Error", "No subscription packages available.");
    }
  } catch (e) {
    if (!e.userCancelled) {
      Alert.alert("Purchase Error", e.message);
    }
  } finally {
    setProcessing(false);
  }
};