// phishguard/app/login.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, ScrollView } from "react-native";
import {
  register,
  login,
  logout,
  loadToken,
  setAuthHeaderFromStorage,
} from "../src/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("trainer@example.com");
  const [password, setPassword] = useState("test1234");
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER">("PROVIDER");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await setAuthHeaderFromStorage();
      const t = await loadToken();
      setToken(t);
    })();
  }, []);

  const doRegister = async () => {
    try {
      await register(email, password, role);
      Alert.alert("Registered", `Registered ${email} as ${role}`);
    } catch (e: any) {
      Alert.alert("Register failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  const doLogin = async () => {
    try {
      const res = await login(email, password);
      await setAuthHeaderFromStorage();
      const t = await loadToken();
      setToken(t);
      Alert.alert("Logged in", t ? `Token saved (${t.slice(0, 24)}...)` : JSON.stringify(res));
    } catch (e: any) {
      Alert.alert("Login failed", e?.response?.data?.detail || e?.message || String(e));
    }
  };

  const doLogout = async () => {
    await logout();
    setToken(null);
    Alert.alert("Logged out");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Auth</Text>

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
      />

      <Text>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="password"
        secureTextEntry
        style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Button title="PROVIDER" onPress={() => setRole("PROVIDER")} />
        <Button title="CUSTOMER" onPress={() => setRole("CUSTOMER")} />
        <Text style={{ alignSelf: "center" }}>{role}</Text>
      </View>

      <Button title="Register" onPress={doRegister} />
      <Button title="Login" onPress={doLogin} />
      <Button title="Logout" onPress={doLogout} />

      <Text style={{ marginTop: 20, fontWeight: "600" }}>Stored Token</Text>
      <Text selectable>{token ?? "(none)"}</Text>
    </ScrollView>
  );
}