// app/(tabs)/train/[moduleID].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { fetchTrainingScenarios, submitAttempt } from "../../src/api";

export default function ModuleQuestions() {
  const { moduleID } = useLocalSearchParams();
  const moduleIdNum = Number(moduleID);

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchTrainingScenarios(moduleIdNum);
    setScenarios(data);
    setIndex(0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [moduleID]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (scenarios.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 22 }}>
          This module has no scenarios yet.
        </Text>
      </SafeAreaView>
    );
  }

  const current = scenarios[index];

  async function selectChoice(choiceId: number) {
    const res = await submitAttempt(current.id, choiceId);

    if (!res.correct) {
      Alert.alert("Incorrect", "That is not the correct answer.");
      return;
    }

    // Correct → move next
    if (index === scenarios.length - 1) {
      Alert.alert("Module Complete", "Nice! You finished this module.", [
        {
          text: "Go Back",
          onPress: () => router.back(),
        },
      ]);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 10,
        paddingHorizontal: 20,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 10 }}>
          Question {index + 1} of {scenarios.length}
        </Text>

        <Text
          style={{
            fontSize: 20,
            marginBottom: 20,
            lineHeight: 28,
            color: "#444",
          }}
        >
          {current.prompt}
        </Text>

        {current.choices.map((c: any) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => selectChoice(c.id)}
            style={{
              padding: 15,
              backgroundColor: "#f3f3f3",
              borderRadius: 10,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#ccc",
            }}
          >
            <Text style={{ fontSize: 18 }}>{c.text}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={{
            marginTop: 25,
            padding: 12,
            backgroundColor: "#3498db",
            borderRadius: 8,
            alignSelf: "flex-start",
          }}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 16, color: "white" }}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}