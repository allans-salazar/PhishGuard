// app/train/[moduleId].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { getTrainingScenarios, attemptScenario } from "../../src/api";

export default function ModuleQuestions() {
  const { moduleId } = useLocalSearchParams();
  const numericId = Number(moduleId);

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerState, setAnswerState] = useState<any>({});
  const [showResults, setShowResults] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await getTrainingScenarios(numericId);
      setScenarios(data);
      setAnswerState({});
      setShowResults(false);
    } catch (e) {
      console.log("Failed to load module:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAnswer(scenarioId: number, choiceId: number) {
    // Prevent multiple attempts
    if (answerState[scenarioId]) return;

    try {
      const res = await attemptScenario(scenarioId, choiceId);

      setAnswerState((prev: any) => ({
        ...prev,
        [scenarioId]: {
          selected: choiceId,
          correct: res.correct,
        },
      }));
    } catch (e) {
      console.log("Error answering:", e);
    }
  }

  // Compute results
  function computeResults() {
    const total = scenarios.length;
    const answered = Object.keys(answerState).length;
    const correct = Object.values(answerState).filter((x: any) => x.correct).length;

    const score = correct / total;
    return {
      total,
      answered,
      correct,
      passed: score >= 0.7,
    };
  }

  if (loading)
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );

  const results = computeResults();

  // =============================
  // RESULTS SCREEN
  // =============================
  if (showResults) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          padding: 25,
        }}
      >
        <Text
          style={{ fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 30 }}
        >
          Results
        </Text>

        <Text style={{ fontSize: 22, textAlign: "center", marginBottom: 10 }}>
          Score: {results.correct}/{results.total}
        </Text>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            textAlign: "center",
            color: results.passed ? "green" : "red",
            marginBottom: 40,
          }}
        >
          {results.passed ? "PASS" : "FAIL"}
        </Text>

        <TouchableOpacity
          onPress={() => load()}
          style={{
            backgroundColor: "#3498db",
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/train")}
          style={{
            backgroundColor: "#2ecc71",
            padding: 15,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
            Go Back Home
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // =============================
  // QUESTIONS SCREEN
  // =============================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 20 }}>
          Training Questions
        </Text>

        {scenarios.map((sc, index) => {
          const state = answerState[sc.id];

          return (
            <View
              key={sc.id}
              style={{
                marginBottom: 30,
                padding: 15,
                borderWidth: 1,
                borderRadius: 10,
                borderColor: "#ccc",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                {index + 1}. {sc.prompt}
              </Text>

              {sc.choices.map((c: any) => {
                let bg = "#eee";

                if (state) {
                  if (state.selected === c.id) {
                    bg = state.correct ? "#2ecc71" : "#e74c3c"; // green or red
                  }
                }

                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => handleAnswer(sc.id, c.id)}
                    style={{
                      padding: 12,
                      backgroundColor: bg,
                      borderRadius: 8,
                      marginVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{c.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* FINISH BUTTON */}
        <TouchableOpacity
          onPress={() => setShowResults(true)}
          style={{
            backgroundColor: "#8e44ad",
            padding: 15,
            borderRadius: 10,
            marginTop: 25,
            marginBottom: 50,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
            Finished?
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}