// app/(auth)/login.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { router, Link } from "expo-router";
import { login } from "../../src/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onLogin() {
    try {
      const res = await login(email.trim(), password);
      const role = (res?.role || "CUSTOMER").toUpperCase();
      if (role === "PROVIDER") router.replace("/(tabs)/provider");
      else router.replace("/(tabs)/catalog");
    } catch (e: any) {
      Alert.alert("Login failed", e?.response?.data?.detail || String(e));
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 12 }}>Welcome back</Text>
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
      <Button title="Login" onPress={onLogin} />
      <Text style={{ textAlign: "center", marginTop: 16 }}>
        New here? <Link href="/(auth)/register">Create an account</Link>
      </Text>
    </View>
  );
}