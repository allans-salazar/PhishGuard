// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { loadToken, loadRole, applyAuthHeader } from "../src/api";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log("ROOT LAYOUT START");

    (async () => {
      const t = await loadToken();
      const r = await loadRole();

      console.log("TOKEN:", t);
      console.log("ROLE:", r);

      // Load token into axios if exists
      if (t) await applyAuthHeader();

      setReady(true);

      // DO NOT redirect here.
      // RootLayout should NOT navigate anywhere.
      //
      // Routing must happen at:
      // - (auth)/login.tsx
      // - (provider)/_layout.tsx
      // - (tabs)/_layout.tsx
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}