import { Tabs, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { loadToken, loadRole } from "../../src/api";

export default function TabsLayout() {
  const [allow, setAllow] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      const r = await loadRole();
      setAllow(t && r === "CUSTOMER");
    })();
  }, []);

  if (allow === null) return null;
  if (!allow) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="catalog" options={{ title: "Catalog" }} />
      <Tabs.Screen name="train" options={{ title: "Train" }} />
      <Tabs.Screen name="ai" options={{ title: "AI" }} />
      <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
    </Tabs>
  );
}