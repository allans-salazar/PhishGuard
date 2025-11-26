// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { loadToken, loadRole } from "../src/api";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      const r = await loadRole();
      setToken(t);
      setRole(r?.toUpperCase?.() || null);
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

  // ❗NOT authenticated → MUST go to login
  if (!token || !role) {
    return (
      <>
        <Redirect href="/(auth)/login" />
        <Stack screenOptions={{ headerShown: false }} />
      </>
    );
  }

  // Logged in as PROVIDER
  if (role === "PROVIDER") {
    return (
      <>
        <Redirect href="/(provider)/" />
        <Stack screenOptions={{ headerShown: false }} />
      </>
    );
  }

  // Logged in as CUSTOMER
  return (
    <>
        <Redirect href="/(tabs)/catalog" />
        <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}