import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="vacas" options={{ title: 'Vacas' }} />
      <Tabs.Screen name="producao" options={{ title: 'Produção' }} />
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
