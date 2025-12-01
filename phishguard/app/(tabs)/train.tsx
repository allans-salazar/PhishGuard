// app/(tabs)/train.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listCatalog, listMyPurchases } from "../../src/api";
import { router } from "expo-router";

export default function Train() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [mods, purchased] = await Promise.all([
      listCatalog(),
      listMyPurchases(),
    ]);

    const filtered = mods.filter((m) => purchased.includes(Number(m.id)));

    setModules(filtered);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (modules.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 22, textAlign: "center" }}>
          You have not purchased any modules yet.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 15 }}>
        Your Training Modules
      </Text>

      {modules.map((m) => (
        <TouchableOpacity
          key={m.id}
          onPress={() =>
            router.push({
              pathname: "/train/[moduleId]",
              params: { moduleId: String(m.id) },
            })
          }
          style={{
            padding: 15,
            marginVertical: 10,
            borderWidth: 1,
            borderRadius: 10,
            backgroundColor: "#d4ffd4",
            borderColor: "#2ecc71",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "600" }}>{m.title}</Text>
          <Text style={{ marginTop: 6, fontSize: 15 }}>{m.description}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}