// app/(provider)/edit-choice.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import api from "../../src/api";

export default function EditChoice() {
  const { choiceId } = useLocalSearchParams();
  const cid = Number(choiceId);

  const [choice, setChoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      // FIXED: correct endpoint
      const res = await api.api.get(`/provider/choices/${cid}`);

      setChoice(res.data);
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh when returning to this screen
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function save() {
    try {
      await api.api.put(`/provider/choices/${cid}`, {
        choice_text: choice.choice_text,
        is_correct: Number(choice.is_correct), // ensure numeric 0 or 1
      });

      Alert.alert("Updated", "Choice updated");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    }
  }

  if (loading || !choice) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Edit Choice</Text>

      {/* Choice text */}
      <TextInput
        value={choice.choice_text}
        onChangeText={(t) => setChoice({ ...choice, choice_text: t })}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
        placeholder="Choice text"
      />

      {/* Correctness field */}
      <TextInput
        value={String(choice.is_correct)}
        onChangeText={(t) =>
          setChoice({ ...choice, is_correct: t === "1" ? 1 : 0 })
        }
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
        keyboardType="numeric"
        placeholder="0 or 1 (correct)"
      />

      <Button title="Save Changes" onPress={save} />
    </View>
  );
}