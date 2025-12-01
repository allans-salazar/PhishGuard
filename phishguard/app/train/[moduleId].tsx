// app/train/[moduleId].tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { getTrainingScenarios, attemptScenario } from "../../src/api";

export default function ModuleQuestions() {
  // read route param
  const { moduleId } = useLocalSearchParams();
  console.log("MODULE ID PARAM:", moduleId);

  const id = Number(moduleId);

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      if (!moduleId || isNaN(id)) {
        console.log("INVALID MODULE ID:", moduleId);
        Alert.alert("Error", "Invalid module selected.");
        return;
      }

      const data = await getTrainingScenarios(id);
      setScenarios(data);
    } catch (err) {
      console.log("Failed to load module:", err);
      Alert.alert("Unable to load training module");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [moduleId]);

  async function pickChoice(scenarioId: number, choiceId: number) {
    try {
      const res = await attemptScenario(scenarioId, choiceId);

      if (res.correct) {
        Alert.alert("Correct!", "Good job! That was the right choice.");
      } else {
        Alert.alert("Incorrect", "This was not the correct answer. Try again!");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to submit answer.");
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ fontSize: 16, color: "#3498db" }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 20 }}>
        Module Questions
      </Text>

      {scenarios.map((s) => (
        <View
          key={s.id}
          style={{
            padding: 15,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "600" }}>
            {s.channel} Scenario
          </Text>
          <Text style={{ marginTop: 10 }}>{s.prompt}</Text>

          <Text style={{ marginTop: 15, fontWeight: "700", fontSize: 16 }}>
            Choices:
          </Text>

          {s.choices.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={{
                marginTop: 10,
                padding: 12,
                backgroundColor: "#e8e8e8",
                borderRadius: 6,
              }}
              onPress={() => pickChoice(s.id, c.id)}
            >
              <Text>{c.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </SafeAreaView>
  );
}