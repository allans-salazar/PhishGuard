// app/(tabs)/train.tsx
import React, { useState } from "react";
import { View, Text, Button, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { listCatalog, askAI } from "../../src/api";
import { router } from "expo-router";

export default function Train() {
  const [modules, setModules] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [moduleId, setModuleId] = useState<number | null>(null);

  async function loadModules() {
    try {
      setLoading(true);
      const data = await listCatalog();
      setModules(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadScenariosFor(moduleId: number) {
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/train/${moduleId}/scenarios`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setScenarios(data);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }

  async function answer(choiceId: number, scenarioId: number) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/train/attempt/${scenarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice_id: choiceId }),
      });

      const data = await res.json();

      if (data.correct) {
        Alert.alert("Correct!", "Nice job!");
      } else {
        Alert.alert("Incorrect", "Review the question and try again.");
      }

      // Move to next question
      if (currentIndex + 1 < scenarios.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        Alert.alert("Complete", "You've finished the module!");
      }
    } catch (e) {
      Alert.alert("Error", "Could not submit answer");
    }
  }

  // --- UI states ---
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Step 1 — Choose a module
  if (!moduleId) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 22, marginBottom: 15 }}>Choose a module to train:</Text>
        <Button title="Load Modules" onPress={loadModules} />

        {modules.map((m) => (
          <TouchableOpacity
            key={m.id}
            onPress={() => {
              setModuleId(m.id);
              loadScenariosFor(m.id);
            }}
            style={{
              padding: 12,
              marginVertical: 8,
              borderWidth: 1,
              borderRadius: 8,
              borderColor: "#ccc",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{m.title}</Text>
            <Text>{m.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Step 2 — Show scenarios
  if (scenarios.length === 0) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 20 }}>No scenarios available.</Text>
      </View>
    );
  }

  const sc = scenarios[currentIndex];

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>Question {currentIndex + 1}</Text>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>{sc.prompt}</Text>

      {sc.choices.map((c: any) => (
        <TouchableOpacity
          key={c.id}
          onPress={() => answer(c.id, sc.id)}
          style={{
            marginVertical: 8,
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: "#555",
          }}
        >
          <Text style={{ fontSize: 16 }}>{c.text}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: 30 }}>
        <Button title="Back to Catalog" onPress={() => router.replace("/(tabs)/catalog")} />
      </View>
    </View>
  );
}