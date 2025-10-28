import React from "react";
import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Home() {
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize: 20 }}>PhishGuard Home</Text>
      <Button title="Go to Auth" onPress={() => router.push("/login")} />
      <Button title="Go to Catalog" onPress={() => router.push("/catalog")} />
      <Button title="Go to Provider" onPress={() => router.push("/provider")} />
    </View>
  );
}