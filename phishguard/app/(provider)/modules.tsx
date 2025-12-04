// app/(provider)/modules.tsx
import { View, Text, Button, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { providerListModules } from "../../src/api";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function ProviderModules() {
  const [modules, setModules] = useState([]);

  async function load() {
    const data = await providerListModules();
    setModules(data);
  }

  // 🔥 Auto-refresh every time page becomes active
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>My Modules</Text>

      <Button
        title="Create Module"
        onPress={() => router.push("/(provider)/create")}
      />

      {modules.map((m) => (
        <TouchableOpacity
          key={m.id}
          onPress={() =>
            router.push(`/(provider)/module-questions?moduleId=${m.id}`)
          }
          style={{
            marginTop: 16,
            padding: 16,
            borderWidth: 1,
            borderRadius: 10,
            backgroundColor: "#f3f3f3",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600" }}>{m.title}</Text>
          <Text>{m.description}</Text>
          <Text style={{ marginTop: 4 }}>Price: {m.price}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}