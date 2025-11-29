import { Stack, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { loadToken, loadRole } from "../../src/api";

export default function ProviderLayout() {
  const [allow, setAllow] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      const r = await loadRole();
      setAllow(t && r === "PROVIDER");
    })();
  }, []);

  if (allow === null) return null;
  if (!allow) return <Redirect href="/(auth)/login" />;

  return (
  <Stack
    screenOptions={{
      headerShown: true,
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: "#f9f9f9" },
    }}
  />
);
}