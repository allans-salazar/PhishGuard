// app/(provider)/edit-choice.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import api from "../../src/api";

export default function EditChoice() {
  const { choiceId } = useLocalSearchParams();
  const cid = Number(choiceId);

  const [choice, setChoice] = useState<any>(null);

  async function load() {
    const res = await api.api.get(`/provider/choice/${cid}`);
    setChoice(res.data);
  }

  async function save() {
    try {
      await api.api.put(`/provider/choices/${cid}`, {
        choice_text: choice.choice_text,
        is_correct: Number(choice.is_correct),
      });
      Alert.alert("Updated", "Choice updated");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!choice) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Edit Choice</Text>

      <TextInput
        value={choice.choice_text}
        onChangeText={(t) => setChoice({ ...choice, choice_text: t })}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        value={String(choice.is_correct)}
        onChangeText={(t) => setChoice({ ...choice, is_correct: t })}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Button title="Save Changes" onPress={save} />
    </View>
  );
}