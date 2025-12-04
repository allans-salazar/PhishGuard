import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { walletBalance, walletAddCard } from "../../src/api";

export default function WalletScreen() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");

  async function loadWallet() {
    setLoading(true);
    const data = await walletBalance();
    setWallet(data);
    setLoading(false);
  }

  async function addCard() {
    if (card.length < 12) {
      Alert.alert("Error", "Invalid card number");
      return;
    }

    try {
      const res = await walletAddCard(card, exp, cvv);

      // Update wallet immediately
      setWallet({
        credits: 50,
        has_card: true,
        last4: card.slice(-4),
      });

      Alert.alert("Card Added", "You received $50 credits!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add card");
    }
  }

  useEffect(() => {
    loadWallet();
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
          fontSize: 32,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Wallet
      </Text>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>
          Account Balance: ${wallet.credits}
        </Text>

        {wallet.has_card ? (
          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              Payment Method
            </Text>
            <Text style={{ marginTop: 10, fontSize: 16 }}>
              Card on file: **** **** **** {wallet.last4}
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              Add Payment Method
            </Text>

            <TextInput
              placeholder="Card Number"
              value={card}
              onChangeText={setCard}
              style={{
                borderWidth: 1,
                padding: 12,
                borderRadius: 8,
                marginTop: 12,
              }}
            />

            <TextInput
              placeholder="MM/YY"
              value={exp}
              onChangeText={setExp}
              style={{
                borderWidth: 1,
                padding: 12,
                borderRadius: 8,
                marginTop: 12,
              }}
            />

            <TextInput
              placeholder="CVV"
              secureTextEntry
              value={cvv}
              onChangeText={setCvv}
              style={{
                borderWidth: 1,
                padding: 12,
                borderRadius: 8,
                marginTop: 12,
              }}
            />

            <View style={{ marginTop: 18 }}>
              <Button title="Save Card & Get $50" onPress={addCard} />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}