// phishguard/app/catalog.tsx
import { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Alert, TextInput } from "react-native";
import { listModules, topup, purchase } from "../src/api";

export default function CatalogScreen() {
  const [modules, setModules] = useState<any[]>([]);
  const [amount, setAmount] = useState("25");

  // Load all modules available in catalog
  async function loadModules() {
    try {
      const data = await listModules();
      setModules(data);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail || e.message);
    }
  }

  useEffect(() => {
    loadModules();
  }, []);

  // Handle wallet top-up
  async function handleTopup() {
    try {
      const amt = Number(amount || "0");
      const res = await topup(amt);
      Alert.alert("Top-up successful", `You now have ${res.credits} credits`);
    } catch (e: any) {
      Alert.alert("Top-up failed", e?.response?.data?.detail || e.message);
    }
  }

  // Handle module purchase
  async function handlePurchase(id: number) {
    try {
      const res = await purchase(id);
      Alert.alert("Purchase successful", `Remaining credits: ${res.credits}`);
    } catch (e: any) {
      Alert.alert("Purchase failed", e?.response?.data?.detail || e.message);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 10 }}>
        Catalog
      </Text>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: 8,
            flex: 1,
          }}
          placeholder="Enter top-up amount"
        />
        <Button title="Top-up" onPress={handleTopup} />
      </View>

      <FlatList
        data={modules}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {item.title}
            </Text>
            <Text>{item.description}</Text>
            <Text style={{ marginVertical: 6 }}>Price: {item.price}</Text>
            <Button
              title="Purchase"
              onPress={() => handlePurchase(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}