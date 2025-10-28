import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, FlatList } from "react-native";
import { providerListModules, providerCreateModule, providerCreateScenario } from "../src/api";

export default function Provider() {
  const [mods, setMods] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("10");
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  const [scenarioChannel, setScenarioChannel] = useState<"EMAIL"|"SMS"|"WEB">("EMAIL");
  const [scenarioCorrect, setScenarioCorrect] = useState<0|1>(1);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  const refresh = async () => {
    try {
      const data = await providerListModules();
      setMods(data);
    } catch (e: any) {
      Alert.alert("Load failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    try {
      if (!title.trim()) return Alert.alert("Need title");
      const res = await providerCreateModule(title.trim(), desc.trim(), Number(price) || 0);
      setTitle(""); setDesc(""); setPrice("10");
      await refresh();
      Alert.alert("Module created", `id=${res.id}`);
    } catch (e: any) {
      Alert.alert("Create failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  const addScenario = async () => {
    try {
      if (!selectedModuleId) return Alert.alert("Pick a module (tap it) first");
      if (!scenarioPrompt.trim()) return Alert.alert("Need prompt");
      const res = await providerCreateScenario(selectedModuleId, scenarioChannel, scenarioPrompt.trim(), scenarioCorrect);
      setScenarioPrompt("");
      Alert.alert("Scenario created", `id=${res.id}`);
    } catch (e: any) {
      Alert.alert("Scenario failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      <Text style={{ fontSize:18, fontWeight:"700" }}>My Modules</Text>
      <FlatList
        data={mods}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ gap:8 }}
        renderItem={({ item }) => (
          <View
            style={{
              padding:10, borderWidth:1, borderRadius:8,
              backgroundColor: selectedModuleId === item.id ? "#eef" : "#fff"
            }}
          >
            <Text style={{ fontWeight:"600" }} onPress={() => setSelectedModuleId(item.id)}>
              #{item.id} {item.title} (${item.price})
            </Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />

      <Text style={{ fontSize:16, fontWeight:"600", marginTop:8 }}>Create Module</Text>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={{ borderWidth:1, padding:8, borderRadius:6 }} />
      <TextInput placeholder="Description" value={desc} onChangeText={setDesc} style={{ borderWidth:1, padding:8, borderRadius:6 }} />
      <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={{ borderWidth:1, padding:8, borderRadius:6 }} />
      <Button title="Create" onPress={create} />

      <Text style={{ fontSize:16, fontWeight:"600", marginTop:8 }}>Add Scenario to Selected Module</Text>
      <TextInput placeholder="Prompt" value={scenarioPrompt} onChangeText={setScenarioPrompt} style={{ borderWidth:1, padding:8, borderRadius:6 }} />
      <View style={{ flexDirection:"row", gap:8 }}>
        <Button title="EMAIL" onPress={() => setScenarioChannel("EMAIL")} />
        <Button title="SMS" onPress={() => setScenarioChannel("SMS")} />
        <Button title="WEB" onPress={() => setScenarioChannel("WEB")} />
      </View>
      <View style={{ flexDirection:"row", gap:8 }}>
        <Button title="Correct = Report (1)" onPress={() => setScenarioCorrect(1)} />
        <Button title="Correct = Click (0)" onPress={() => setScenarioCorrect(0)} />
      </View>
      <Button title="Add Scenario" onPress={addScenario} />
    </View>
  );
}