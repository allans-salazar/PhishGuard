// app/(tabs)/questions/[moduleID].tsx

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

// ✅ Correct import path
import { getTrainingScenarios, attemptScenario } from "../../../src/api";

export default function ModuleQuestions() {
  const { moduleID } = useLocalSearchParams();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getTrainingScenarios(Number(moduleID));
    setScenarios(data);
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

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 15 }}>
        Training Questions
      </Text>

      {scenarios.map((sc) => (
        <View
          key={sc.id}
          style={{
            marginBottom: 20,
            padding: 15,
            borderWidth: 1,
            borderRadius: 10,
            borderColor: "#ccc",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600" }}>{sc.prompt}</Text>

          {sc.choices.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={{
                marginTop: 10,
                padding: 12,
                backgroundColor: "#3498db",
                borderRadius: 8,
              }}
              onPress={async () => {
                const res = await attemptScenario(sc.id, c.id);
                Alert.alert(res.correct ? "Correct!" : "Incorrect");
              }}
            >
              <Text style={{ color: "white", textAlign: "center" }}>{c.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </SafeAreaView>
  );
}