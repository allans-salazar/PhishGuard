import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { providerListModules } from "../../src/api";

export default function ProviderModules() {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    providerListModules().then(setModules).catch(console.error);
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16 }}>
        My Modules
      </Text>

      <FlatList
        data={modules}
        keyExtractor={(m) => m.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#ddd" }}>
            <Text style={{ fontWeight: "600" }}>{item.title}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}