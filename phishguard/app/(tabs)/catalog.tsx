import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { listCatalog, listMyPurchases, walletBalance } from "../../src/api";

export default function Catalog() {
  const [modules, setModules] = useState<any[]>([]);
  const [purchased, setPurchased] = useState<number[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [mods, mine, bal] = await Promise.all([
      listCatalog(),
      listMyPurchases(),
      walletBalance(),
    ]);

    setModules(mods);
    setPurchased(mine);
    setWallet(bal);
    setLoading(false);
  }

  // Refresh when tab becomes active
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function buyModule(id: number, price: number) {
    if (!wallet || wallet.credits < price) {
      Alert.alert("Insufficient Funds", "You do not have enough credits.");
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Buy this module for $${price}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            try {
              const res = await fetch(`http://127.0.0.1:8000/purchase/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });

              if (res.status !== 200) {
                Alert.alert("Error", "Purchase failed.");
                return;
              }

              Alert.alert("Success", "Module purchased!");
              load(); // refresh
            } catch (e) {
              Alert.alert("Error", "Could not complete purchase");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        Wallet Balance: ${wallet?.credits ?? 0}
      </Text>

      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 15 }}>
        Training Catalog
      </Text>

      {modules.map((m) => {
        const owned = purchased.includes(Number(m.id));

        return (
          <View
            key={m.id}
            style={{
              padding: 15,
              marginVertical: 8,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: owned ? "#d4ffd4" : "#fff",
              borderColor: owned ? "#2ecc71" : "#ccc",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600" }}>{m.title}</Text>
            <Text>{m.description}</Text>

            {owned ? (
              <Text
                style={{
                  marginTop: 8,
                  fontWeight: "bold",
                  color: "green",
                }}
              >
                ✔ Purchased
              </Text>
            ) : (
              <>
                <Text style={{ marginTop: 8, fontSize: 16 }}>
                  Price: ${m.price}
                </Text>

                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    padding: 12,
                    backgroundColor: "#2ecc71",
                    borderRadius: 6,
                  }}
                  onPress={() => buyModule(m.id, m.price)}
                >
                  <Text
                    style={{ color: "white", textAlign: "center", fontSize: 16 }}
                  >
                    Buy Module
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );
      })}
    </SafeAreaView>
  );
}