import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' } as any,
        headerTitleStyle: { fontWeight: '900', fontSize: 20, color: colors.primaryContainer, letterSpacing: -0.5 },
        headerTitle: 'VacaFácil',
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primaryContainer,
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vacas"
        options={{
          title: 'Vacas',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="agriculture" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="producao"
        options={{
          title: 'Produção',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="show-chart" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-balance-wallet" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
