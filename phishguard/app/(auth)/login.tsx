import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { login, loadRole } from "../../src/api";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function doLogin() {
    try {
      await login(email, password);
      const role = await loadRole();

      if (role === "PROVIDER") router.replace("/(provider)");
      else router.replace("/(tabs)/catalog");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Login failed");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 25,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        Login
      </Text>

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 16,
        }}
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 15,
          borderRadius: 8,
          marginBottom: 30,
          fontSize: 16,
        }}
      />

      {/* LOGIN BUTTON */}
      <Button title="Login" onPress={doLogin} />

      {/* CREATE ACCOUNT BUTTON */}
      <TouchableOpacity
        style={{
          marginTop: 25,
          paddingVertical: 12,
        }}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text
          style={{
            textAlign: "center",
            color: "#2e86de",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Create an Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}