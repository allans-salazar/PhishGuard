import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { providerCreateModule } from "../../src/api";

export default function ProviderCreate() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  async function submit() {
    try {
      await providerCreateModule(title, desc, Number(price));
      Alert.alert("Success", "Module created!");
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        Create Module
      </Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Description"
        value={desc}
        onChangeText={setDesc}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />

      <Button title="Create" onPress={submit} />
    </View>
  );
}