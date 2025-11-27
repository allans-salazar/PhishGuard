// app/(provider)/add-choice.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Switch, Button, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  providerAddChoice,
  providerGetChoice,
  providerUpdateChoice,
} from "../../src/api";

export default function AddChoice() {
  const { scenarioId, choiceId } = useLocalSearchParams();
  const sid = Number(scenarioId);
  const cid = choiceId ? Number(choiceId) : null;

  const [choiceText, setChoiceText] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  async function loadChoice() {
    if (!cid) return;

    try {
      const c = await providerGetChoice(cid);
      setChoiceText(c.choice_text);
      setIsCorrect(!!c.is_correct);
    } catch (e: any) {
      Alert.alert("Error loading choice", String(e.message || e));
    }
  }

  async function save() {
    try {
      if (cid) {
        await providerUpdateChoice(cid, choiceText, isCorrect ? 1 : 0);
        Alert.alert("Updated", "Choice updated.");
      } else {
        await providerAddChoice(sid, choiceText, isCorrect ? 1 : 0);
        Alert.alert("Added", "Choice created.");
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    }
  }

  useEffect(() => {
    loadChoice();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        {cid ? "Edit Choice" : "Add Choice"}
      </Text>

      <TextInput
        value={choiceText}
        onChangeText={setChoiceText}
        placeholder="Choice text"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Switch value={isCorrect} onValueChange={setIsCorrect} />
        <Text>Is this the correct answer?</Text>
      </View>

      <Button title={cid ? "Save Changes" : "Add Choice"} onPress={save} />
    </View>
  );
}