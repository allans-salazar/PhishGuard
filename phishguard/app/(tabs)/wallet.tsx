import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
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

      // ⬅️ Immediately update wallet state with new info
      setWallet({
        credits: 50,
        has_card: true,
        last4: card.slice(-4),
      });

      Alert.alert("Card Added", "You have received $50 credits!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed");
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Wallet</Text>

      <Text style={{ marginTop: 20, fontSize: 18 }}>
        Account Total Amount: ${wallet.credits}
      </Text>

      {wallet.has_card ? (
        <>
          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "600" }}>
            Payment Method
          </Text>
          <Text style={{ marginTop: 10 }}>
            Card on file: **** **** **** {wallet.last4}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "600" }}>
            Add Payment Method
          </Text>

          <TextInput
            placeholder="Card Number"
            value={card}
            onChangeText={setCard}
            style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
          />

          <TextInput
            placeholder="MM/YY"
            value={exp}
            onChangeText={setExp}
            style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
          />

          <TextInput
            placeholder="CVV"
            secureTextEntry
            value={cvv}
            onChangeText={setCvv}
            style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
          />

          <Button title="Save Card & Get $50" onPress={addCard} />
        </>
      )}
    </View>
  );
}