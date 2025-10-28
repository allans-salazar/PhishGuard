import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Alert } from "react-native";
import { listCatalog, walletBalance, walletTopup, purchase } from "../../src/api";

export default function Catalog() {
  const [items, setItems] = useState<any[]>([]);
  const [credits, setCredits] = useState<number>(0);

  const refresh = async () => {
    const [mods, wal] = await Promise.all([listCatalog(), walletBalance()]);
    setItems(mods);
    setCredits(wal.credits);
  };

  useEffect(() => {
    refresh().catch(e => Alert.alert("Error", String(e?.response?.data?.detail || e?.message || e)));
  }, []);

  const doTopup = async (amt = 20) => {
    try {
      await walletTopup(amt);
      await refresh();
      Alert.alert("Top-up", `Added ${amt} credits`);
    } catch (e: any) {
      Alert.alert("Top-up failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  const buy = async (id: number, price: number) => {
    try {
      if (credits < price) {
        Alert.alert("Not enough credits", "Top up first.");
        return;
      }
      await purchase(id);
      await refresh();
      Alert.alert("Purchased", `Module #${id}`);
    } catch (e: any) {
      Alert.alert("Purchase failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Credits: {credits}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Top-up +20" onPress={() => doTopup(20)} />
        <Button title="Top-up +50" onPress={() => doTopup(50)} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}  (${item.price})</Text>
            <Text style={{ opacity: 0.8, marginTop: 4 }}>{item.description}</Text>
            <Text style={{ opacity: 0.6, marginTop: 4 }}>By: {item.provider_email}</Text>
            <View style={{ marginTop: 8 }}>
              <Button title="Buy" onPress={() => buy(item.id, item.price)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}