// app/(tabs)/catalog.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  listCatalog,
  listMyPurchases,
  walletBalance,
  loadToken,
} from "../../src/api";
import { router } from "expo-router";

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

  async function buyModule(id: number, price: number) {
    if (!wallet || wallet.credits < price) {
      Alert.alert("Insufficient Funds", "You do not have enough credits.");
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Are you sure you want to buy this module for $${price}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            try {
              const token = await loadToken();

              const res = await fetch(
                `http://127.0.0.1:8000/purchase/${id}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // 🔥 REQUIRED
                  },
                }
              );

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                Alert.alert("Purchase Failed", err.detail || "Unknown error");
                return;
              }

              Alert.alert("Success", "Module purchased successfully!");
              load(); // refresh wallet + purchases
            } catch (e) {
              Alert.alert("Error", "Unable to complete purchase.");
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
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
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Wallet Balance: ${wallet?.credits ?? 0}
      </Text>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          marginBottom: 15,
        }}
      >
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
              <>
                <Text
                  style={{
                    marginTop: 8,
                    fontWeight: "bold",
                    color: "green",
                  }}
                >
                  ✔ Purchased
                </Text>

                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    padding: 12,
                    backgroundColor: "#3498db",
                    borderRadius: 6,
                  }}
                  onPress={() =>
                    router.push(`/(tabs)/train?moduleId=${m.id}`)
                  }
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontSize: 16,
                    }}
                  >
                    Start Training
                  </Text>
                </TouchableOpacity>
              </>
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
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontSize: 16,
                    }}
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