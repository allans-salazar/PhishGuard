// app/(auth)/register.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert, Switch } from "react-native";
import { router, Link } from "expo-router";
import { register } from "../../src/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProvider, setIsProvider] = useState(false);

  async function onRegister() {
    try {
      const role = isProvider ? "PROVIDER" : "CUSTOMER";
      const res = await register(email.trim(), password, role as any);
      const r = (res?.role || role).toUpperCase();
      if (r === "PROVIDER") router.replace("/(tabs)/provider");
      else router.replace("/(tabs)/catalog");
    } catch (e: any) {
      Alert.alert("Register failed", e?.response?.data?.detail || String(e));
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 12 }}>Create account</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Switch value={isProvider} onValueChange={setIsProvider} />
        <Text>Register as Provider</Text>
      </View>
      <Button title="Create Account" onPress={onRegister} />
      <Text style={{ textAlign: "center", marginTop: 16 }}>
        Already have an account? <Link href="/(auth)/login">Login</Link>
      </Text>
    </View>
  );
}