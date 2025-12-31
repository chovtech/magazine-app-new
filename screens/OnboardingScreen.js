import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const onboardingSlides = [
  {
    id: '1',
    title: 'Contemporary World Nigeria Magazine App',
    description:
      'Stay informed with insightful articles, breaking news, and deep analyses from around the globe — all in one place.',
    image: require('../assets/img/slide6.jpg'),
  },
  {
    id: '2',
    title: 'Shaping China-Nigeria Economic Relationship',
    description:
      'Exploring trade, investment, and strategic cooperation shaping China-Nigeria’s economic partnership today.',
    image: require('../assets/img/slide2.jpg'),
  },
  {
    id: '3',
    title: 'Get the latest update on issues around the world',
    description:
      'From politics to culture, access timely updates and expert perspectives on the stories that matter most.',
    image: require('../assets/img/slide5.jpg'),
  },
];

const OnboardingContent = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const panGestureRef = useRef();
  const insets = useSafeAreaInsets();

  const goToNextSlide = async () => {
    if (isAnimating) return;

    if (currentSlide < onboardingSlides.length - 1) {
      setIsAnimating(true);
      const newIndex = currentSlide + 1;
      setCurrentSlide(newIndex);
      Animated.spring(translateX, {
        toValue: -width * newIndex,
        useNativeDriver: true,
        tension: 30,
        friction: 8,
      }).start(() => setIsAnimating(false));
    } else {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.replace('MainTabs');
    }
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    navigation.replace('MainTabs');
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      let newIndex = currentSlide;

      if (translationX < -50 && currentSlide < onboardingSlides.length - 1) {
        newIndex = currentSlide + 1;
      } else if (translationX > 50 && currentSlide > 0) {
        newIndex = currentSlide - 1;
      }

      dragX.setValue(0);
      setCurrentSlide(newIndex);

      Animated.spring(translateX, {
        toValue: -width * newIndex,
        useNativeDriver: true,
        tension: 30,
        friction: 8,
      }).start();
    }
  };

  const slideTranslate = Animated.add(translateX, dragX);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <PanGestureHandler
        ref={panGestureRef}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.slidesContainer,
            {
              width: width * onboardingSlides.length,
              transform: [{ translateX: slideTranslate }],
            },
          ]}
        >
          {onboardingSlides.map((slide, index) => (
            <View key={slide.id} style={{ width, height, overflow: 'hidden' }}>
              <ImageBackground
                source={slide.image}
                style={styles.backgroundImage}
                resizeMode="cover"
              >
                <View style={styles.gradientOverlay}>
                  <View
                    style={[
                      styles.contentArea,
                      { paddingBottom: 20 + insets.bottom },
                    ]}
                  >
                    {/* Indicators */}
                    <View style={styles.indicatorContainer}>
                      {onboardingSlides.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.indicator,
                            currentSlide === i && styles.activeIndicator,
                          ]}
                        />
                      ))}
                    </View>

                    {/* Text */}
                    <View style={styles.textContainer}>
                      <Text style={styles.title}>{slide.title}</Text>
                      <Text style={styles.description}>
                        {slide.description}
                      </Text>
                    </View>

                    {/* Buttons */}
                    <View
                      style={[
                        styles.buttonWrapper,
                        { marginBottom: 15 + insets.bottom },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.fullWidthButton}
                        onPress={goToNextSlide}
                        disabled={isAnimating}
                      >
                        <Text style={styles.buttonText}>
                          {currentSlide === onboardingSlides.length - 1
                            ? 'Get Started'
                            : 'Next'}
                        </Text>
                      </TouchableOpacity>

                      {currentSlide !== onboardingSlides.length - 1 && (
                        <TouchableOpacity
                          style={styles.skipButton}
                          onPress={skipOnboarding}
                        >
                          <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

// ✅ Wrapper component that decides whether to show onboarding or main tabs
        const OnboardingScreen = ({ navigation }) => {
          const [isLoading, setIsLoading] = useState(true);
          const [hasOnboarded, setHasOnboarded] = useState(false);

          useEffect(() => {
            const loadData = async () => {
              const onboarded = await AsyncStorage.getItem('hasOnboarded');
              setHasOnboarded(onboarded === 'true');
              setIsLoading(false);
            };
            loadData();
          }, []);

          // ✅ Move navigation.replace into a side effect
          useEffect(() => {
            if (!isLoading && hasOnboarded) {
              navigation.replace('MainTabs');
            }
          }, [isLoading, hasOnboarded]);

          if (isLoading) {
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            );
          }

          // Only render onboarding when not yet onboarded
          if (!hasOnboarded) {
            return <OnboardingContent navigation={navigation} />;
          }

          // Render nothing temporarily while navigation happens
          return null;
        };


const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0E0316',
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0E0316',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
    width: 30,
  },
  textContainer: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  fullWidthButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    width: '80%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0316',
  },
});

export default OnboardingScreen;
