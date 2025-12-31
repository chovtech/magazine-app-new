import React, { useEffect, useState } from 'react';
import { BackHandler, Alert } from 'react-native';
import { NavigationContainer, CommonActions, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import SaveScreen from '../screens/SaveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ArticleDetailsScreen from '../screens/ArticleDetailsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PaymentScreen from "../screens/PaymentScreen";

import LogoutScreen from "../screens/LogoutScreen";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import CancelBillingScreen from "../screens/CancelBillingScreen";
import SubscriptionHistoryScreen from "../screens/SubscriptionHistoryScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import TermsAndConditionsScreen from "../screens/TermsAndConditionsScreen";
import AboutUsScreen from "../screens/AboutUsScreen"; 
import ContactUsScreen from "../screens/ContactUsScreen";
import AppInfoScreen from "../screens/AppInfoScreen";
import NotificationScreen from "../screens/NotificationScreen";
import LoginScreen from "../screens/LoginScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import SupportScreen from "../screens/SupportScreen";
import PartnershipScreen from '../screens/PartnershipScreen';
import NotificationDetail from "../screens/NotificationDetail"; // adjust path





const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);

  // Load user info
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  // Handle hardware back button on Home tab
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit App",
          "Do you want to exit?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true; // prevent default behavior
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          height: 80 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarActiveTintColor: 'green',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Discover') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Save') iconName = focused ? 'bookmark' : 'bookmark-outline';
          else if (route.name === 'Profile' || route.name === 'Login') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Save" component={SaveScreen} />
      {user && user.username !== 'guest' ? (
        <Tab.Screen name="Profile" component={ProfileScreen} />
      ) : (
        <Tab.Screen name="Profile" component={ProfileScreen} />
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Logout" component={LogoutScreen} />  
        <Stack.Screen name="Subscription" component={PaymentScreen} /> 
        
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="CancelBilling" component={CancelBillingScreen} />
        <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Partnerships" component={PartnershipScreen} />
        <Stack.Screen name="AppInfo" component={AppInfoScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="NotificationDetail" component={NotificationDetail} options={{ headerShown: false }} 
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
