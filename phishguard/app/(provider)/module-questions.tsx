// app/(provider)/module-questions.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  providerListScenarios,
  providerDeleteScenario,
  providerListChoices,
  providerDeleteChoice,
} from "../../src/api";

export default function ModuleQuestions() {
  const { moduleId } = useLocalSearchParams();
  const mid = Number(moduleId);

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const scenarioList = await providerListScenarios(mid);

      const withChoices = [];
      for (const s of scenarioList) {
        const choices = await providerListChoices(s.id);
        withChoices.push({ ...s, choices });
      }

      setScenarios(withChoices);
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteScenarioConfirm(sid: number) {
    Alert.alert("Confirm", "Delete this scenario?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await providerDeleteScenario(sid);
          load();
        },
      },
    ]);
  }

  async function deleteChoiceConfirm(cid: number) {
    Alert.alert("Confirm", "Delete this choice?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await providerDeleteChoice(cid);
          load();
        },
      },
    ]);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Module Questions</Text>

      <Button
        title="Add Scenario"
        onPress={() => router.push(`/(provider)/add-scenario?moduleId=${mid}`)}
      />

      {scenarios.length === 0 && <Text>No scenarios yet.</Text>}

      {scenarios.map((sc) => (
        <View
          key={sc.id}
          style={{
            marginTop: 16,
            padding: 12,
            borderWidth: 1,
            borderRadius: 10,
            backgroundColor: "#f3f3f3",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            Scenario #{sc.id}
          </Text>
          <Text>Channel: {sc.channel}</Text>
          <Text>Prompt: {sc.prompt}</Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Button
              title="Edit"
              onPress={() =>
                router.push(`/(provider)/add-scenario?scenarioId=${sc.id}`)
              }
            />
            <Button
              title="Delete"
              color="red"
              onPress={() => deleteScenarioConfirm(sc.id)}
            />
          </View>

          <Text style={{ marginTop: 10, fontWeight: "600" }}>Choices</Text>

          {sc.choices.length === 0 && <Text>No choices yet.</Text>}

          {sc.choices.map((c) => (
            <View
              key={c.id}
              style={{
                padding: 8,
                backgroundColor: "white",
                borderWidth: 1,
                borderRadius: 6,
                marginTop: 6,
              }}
            >
              <Text>• {c.choice_text}</Text>
              <Text>Correct: {c.is_correct ? "Yes" : "No"}</Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Button
                  title="Edit"
                  onPress={() =>
                    router.push(
                      `/(provider)/add-choice?scenarioId=${sc.id}&choiceId=${c.id}`
                    )
                  }
                />
                <Button
                  title="Delete"
                  color="red"
                  onPress={() => deleteChoiceConfirm(c.id)}
                />
              </View>
            </View>
          ))}

          <Button
            title="Add Choice"
            onPress={() =>
              router.push(`/(provider)/add-choice?scenarioId=${sc.id}`)
            }
          />
        </View>
      ))}
    </ScrollView>
  );
}