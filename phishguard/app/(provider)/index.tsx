// app/(provider)/index.tsx
import React from "react";
import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function ProviderHome() {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "600", textAlign: "center" }}>
        Provider Dashboard
      </Text>

      <Button
        title="View My Modules"
        onPress={() => router.push("/(provider)/modules")}
      />

      <Button
        title="Create a Module"
        onPress={() => router.push("/(provider)/create")}
      />
    </View>
  );
}