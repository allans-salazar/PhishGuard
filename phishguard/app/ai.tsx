// phishguard/app/ai.tsx
import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { askAI } from "../src/api";

export default function AIScreen() {
  const [q, setQ] = useState("How do I spot a phishing email?");
  async function ask() {
    try {
      const res = await askAI(q);
      Alert.alert("AI", res.answer);
    } catch (e: any) {
      Alert.alert("AI failed", e?.response?.data?.detail || e.message);
    }
  }
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>AI Assistant</Text>
      <TextInput value={q} onChangeText={setQ} style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginVertical: 8 }} />
      <Button title="Ask" onPress={ask} />
    </View>
  );
}