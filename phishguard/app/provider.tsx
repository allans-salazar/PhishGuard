// phishguard/app/provider.tsx
import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { createModule, createScenario } from "../src/api";

export default function ProviderScreen() {
  const [title, setTitle] = useState("Phishing 101");
  const [desc, setDesc] = useState("Spotting basic scams");
  const [price, setPrice] = useState("25");
  const [mid, setMid] = useState<number | null>(null);

  const [prompt, setPrompt] = useState("Your bank needs your password now!");
  const [channel, setChannel] = useState("EMAIL");
  const [correct, setCorrect] = useState("1"); // 1 = phish

  async function makeModule() {
    try {
      const res = await createModule({ title, description: desc, price: Number(price || "0") });
      setMid(res.id);
      Alert.alert("Module created", `id = ${res.id}`);
    } catch (e: any) {
      Alert.alert("Create module failed", e?.response?.data?.detail || e.message);
    }
  }

  async function makeScenario() {
    if (!mid) return Alert.alert("Create a module first");
    try {
      const res = await createScenario({
        module_id: mid, channel, prompt, correct_choice: Number(correct || "0"),
      });
      Alert.alert("Scenario created", `id = ${res.id}`);
    } catch (e: any) {
      Alert.alert("Create scenario failed", e?.response?.data?.detail || e.message);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Provider</Text>

      <Text style={{ marginTop: 12 }}>New Module</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 }} />
      <TextInput value={desc} onChangeText={setDesc} placeholder="Description"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 }} />
      <TextInput value={price} onChangeText={setPrice} placeholder="Price"
        keyboardType="numeric" style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 }} />
      <Button title="Create Module" onPress={makeModule} />

      <Text style={{ marginTop: 16 }}>New Scenario</Text>
      <TextInput value={channel} onChangeText={setChannel} placeholder="Channel (EMAIL/SMS/WEB)"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 }} />
      <TextInput value={prompt} onChangeText={setPrompt} placeholder="Prompt"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 }} />
      <TextInput value={correct} onChangeText={setCorrect} placeholder="Correct choice (0/1)"
        keyboardType="numeric" style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 }} />
      <Button title="Create Scenario" onPress={makeScenario} />

      <Text style={{ marginTop: 10 }}>Current Module ID: {mid ?? "(none)"}</Text>
    </View>
  );
}