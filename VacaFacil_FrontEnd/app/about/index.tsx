import { View, Text, StyleSheet } from 'react-native';

export default function About() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VacaFácil</Text>
      <Text style={styles.version}>Versão 1.0.0</Text>
      <Text style={styles.desc}>Gestão de fazendas leiteiras — controle de rebanho, produção, financeiro e muito mais.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  version: { color: '#888', marginBottom: 16 },
  desc: { textAlign: 'center', color: '#555', lineHeight: 22 },
});
