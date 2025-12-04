// app/(provider)/edit-module.tsx
import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { useLocalSearchParams, router, Link, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import {
  providerListModules,
  providerUpdateModule,
  providerDeleteModule,
} from "../../src/api";

export default function EditModule() {
  const { id } = useLocalSearchParams();
  const moduleId = Number(id);

  const [mod, setMod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load the module details
  async function load() {
    setLoading(true);

    const all = await providerListModules();
    const found = all.find((m) => m.id === moduleId);

    setMod(found);
    setLoading(false);
  }

  // Auto-refresh module when returning to this screen
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  // Save (update) module
  async function save() {
    try {
      await providerUpdateModule(moduleId, mod.title, mod.description, mod.price);
      Alert.alert("Saved", "Module updated successfully");

      // Refresh module list on previous screen
      router.back();
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    }
  }

  // Delete module
  async function del() {
    Alert.alert(
      "Delete Module?",
      "This will delete the module AND all its scenarios & choices.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await providerDeleteModule(moduleId);

              Alert.alert("Deleted", "Module removed");
              router.replace("/(provider)/modules");
            } catch (e: any) {
              Alert.alert("Error", String(e.message || e));
            }
          },
        },
      ]
    );
  }

  if (loading || !mod) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 10 }}>
        Edit Module
      </Text>

      <TextInput
        value={mod.title}
        onChangeText={(t) => setMod({ ...mod, title: t })}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
        placeholder="Module Title"
      />

      <TextInput
        value={mod.description}
        multiline
        onChangeText={(t) => setMod({ ...mod, description: t })}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
        placeholder="Description"
      />

      <TextInput
        value={String(mod.price)}
        keyboardType="numeric"
        onChangeText={(t) => setMod({ ...mod, price: parseFloat(t || "0") })}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
        placeholder="Price"
      />

      {/* Save */}
      <Button title="Save Module" onPress={save} />

      {/* Manage Scenarios */}
      <Link
        href={`/(provider)/module-questions?moduleId=${moduleId}`}
        asChild
      >
        <Button title="Manage Scenarios" />
      </Link>

      {/* Delete */}
      <Button
        title="Delete Module"
        color="red"
        onPress={del}
      />
    </View>
  );
}