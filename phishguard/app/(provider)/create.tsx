// app/(provider)/create.tsx
import React, { useState } from "react";
import { View, TextInput, Text, Button, Alert } from "react-native";
import { providerCreateModule } from "../../src/api";
import { router } from "expo-router";

export default function CreateModule() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  async function submit() {
    try {
      const p = parseFloat(price);
      await providerCreateModule(title, desc, p);
      Alert.alert("Success", "Module created!");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", String(e.message || e));
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Create Module</Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Description"
        multiline
        value={desc}
        onChangeText={setDesc}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8, minHeight: 80 }}
      />

      <TextInput
        placeholder="Price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Button title="Create Module" onPress={submit} />
    </View>
  );
}