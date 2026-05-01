import { Stack } from 'expo-router';

// Grupo de rotas de autenticação — sem header, sem tab bar
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
