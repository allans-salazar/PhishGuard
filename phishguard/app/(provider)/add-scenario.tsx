// app/(provider)/add-scenario.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  providerCreateScenario,
  providerUpdateScenario,
  providerGetScenario,
} from "../../src/api";

export default function AddScenario() {
  const { moduleId, scenarioId } = useLocalSearchParams();
  const mid = moduleId ? Number(moduleId) : null;
  const sid = scenarioId ? Number(scenarioId) : null;

  const [channel, setChannel] = useState("EMAIL");
  const [prompt, setPrompt] = useState("");

  async function loadScenario() {
    if (!sid) return;

    try {
      const data = await providerGetScenario(sid);
      setPrompt(data.prompt);
      setChannel(data.channel);
    } catch (e: any) {
      Alert.alert("Error loading scenario", String(e.message || e));
    }
  }

  async function save() {
    try {
      if (sid) {
        await providerUpdateScenario(sid, channel, prompt);
        Alert.alert("Updated", "Scenario updated.");
      } else {
        await providerCreateScenario(mid!, channel, prompt);
        Alert.alert("Created", "Scenario created.");
      }

      router.back();
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    }
  }

  useEffect(() => {
    loadScenario();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        {sid ? "Edit Scenario" : "Create Scenario"}
      </Text>

      <Text>Channel (EMAIL / SMS / WEB)</Text>
      <TextInput
        value={channel}
        autoCapitalize="characters"
        onChangeText={setChannel}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text>Prompt</Text>
      <TextInput
        value={prompt}
        multiline
        onChangeText={setPrompt}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Button title={sid ? "Save Changes" : "Create Scenario"} onPress={save} />
    </View>
  );
}