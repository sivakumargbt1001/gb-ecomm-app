import { useEffect, useState } from "react";
import { Animated, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useIsFetching } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";

import { SITE_SETTINGS_QUERY_KEY } from "../lib/site-theme-context";

// Android 12+ squeezes the native splash into a small circle, so the logo it
// can show is tiny. This full-screen view takes over the moment JS is up and
// holds the logo large while the store's settings load.
const LOGO = require("../../assets/launch-logo.png");
const LOGO_ASPECT = 1566 / 606;

const MIN_VISIBLE_MS = 1000;
// Settings are decoration; a slow network must not keep the shopper waiting.
const MAX_VISIBLE_MS = 3000;
const FADE_MS = 250;

void SplashScreen.preventAutoHideAsync();

export function LaunchSplash() {
  const { width } = useWindowDimensions();
  const fetching = useIsFetching({ queryKey: SITE_SETTINGS_QUERY_KEY });
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    void SplashScreen.hideAsync();
    const min = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const max = setTimeout(() => setTimedOut(true), MAX_VISIBLE_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, []);

  const ready = minElapsed && (fetching === 0 || timedOut);

  useEffect(() => {
    if (!ready) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(() => setDone(true));
  }, [ready, opacity]);

  if (done) return null;

  const logoWidth = Math.round(width * 0.7);

  return (
    <Animated.View
      testID="launch-splash"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}
    >
      <Image
        source={LOGO}
        resizeMode="contain"
        style={{ width: logoWidth, height: Math.round(logoWidth / LOGO_ASPECT) }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
