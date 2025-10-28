// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { loadToken } from "../src/api"; // uses SecureStore

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await loadToken(); // PERSIST_SESSION=false -> usually null on cold launch
      setAuthed(!!token);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // If not authenticated, force to /login inside (auth) group.
  if (!authed) return <Redirect href="/(auth)/login" />;

  // If authenticated, force to the tabs (catalog by default).
  return (
    <>
      <Redirect href="/(tabs)/catalog" />
      {/* The Stack still needs to exist so child routes render after redirect */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}