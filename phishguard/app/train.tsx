// phishguard/app/train.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert } from "react-native";
import { getScenarios, attemptScenario } from "../src/api";

export default function TrainScreen() {
  const [moduleId, setModuleId] = useState("");
  const [sc, setSc] = useState<any[]>([]);
  const [choice, setChoice] = useState("1");

  async function load() {
    try {
      const m = Number(moduleId || "0");
      if (!m) return;
      const rows = await getScenarios(m);
      setSc(rows);
    } catch (e: any) {
      Alert.alert("Load failed", e?.response?.data?.detail || e.message);
    }
  }
  async function answer(id: number) {
    try {
      const res = await attemptScenario(id, Number(choice || "0"));
      Alert.alert("Result", res.correct ? "✅ Correct" : "❌ Incorrect");
    } catch (e: any) {
      Alert.alert("Attempt failed", e?.response?.data?.detail || e.message);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Training</Text>
      <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
        <TextInput placeholder="Module ID" value={moduleId} onChangeText={setModuleId}
          keyboardType="numeric" style={{ borderWidth: 1, padding: 8, borderRadius: 8, flex: 1 }} />
        <Button title="Load" onPress={load} />
      </View>
      <TextInput placeholder="Your choice 0/1" value={choice} onChangeText={setChoice}
        keyboardType="numeric" style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 10 }} />
      <FlatList
        data={sc}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: "600" }}>{item.channel}</Text>
            <Text style={{ marginVertical: 6 }}>{item.prompt}</Text>
            <Button title="Submit Answer" onPress={() => answer(item.id)} />
          </View>
        )}
      />
    </View>
  );
}