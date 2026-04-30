import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { 
  Button, 
  Input, 
  Card, 
  ChatBubble,
  Colors,
  TextStyles,
  Spacing,
  useFadeIn,
  usePressAnimation 
} from '../design-system';

export function DesignSystemShowcase() {
  const fadeIn = useFadeIn(500);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MeetStranger Design System</Text>
      
      {/* Buttons */}
      <Card variant="elevated" padding="lg" style={styles.section}>
        <Text style={styles.sectionTitle}>Buttons</Text>
        <Button title="Primary Button" onPress={() => {}} />
        <Button title="Secondary Button" onPress={() => {}} variant="secondary" />
        <Button title="Ghost Button" onPress={() => {}} variant="ghost" />
        <Button title="Danger Button" onPress={() => {}} variant="danger" />
        <Button title="Disabled Button" onPress={() => {}} disabled />
      </Card>

      {/* Inputs */}
      <Card variant="elevated" padding="lg" style={styles.section}>
        <Text style={styles.sectionTitle}>Inputs</Text>
        <Input 
          label="Email" 
          placeholder="Digite seu email" 
          keyboardType="email-address"
        />
        <Input 
          label="Senha" 
          placeholder="Digite sua senha" 
          secureTextEntry
        />
        <Input 
          label="Com erro" 
          placeholder="Campo com erro" 
          error="Este campo é obrigatório"
        />
      </Card>

      {/* Chat Bubbles */}
      <Card variant="elevated" padding="lg" style={styles.section}>
        <Text style={styles.sectionTitle}>Chat Bubbles</Text>
        <ChatBubble
          message="Olá! Como você está?"
          position="left"
          username="Usuário"
          timestamp="14:30"
          showUsername
        />
        <ChatBubble
          message="Estou bem, obrigado! E você?"
          position="right"
          timestamp="14:31"
        />
      </Card>

      {/* Cards */}
      <Card variant="outlined" padding="lg" style={styles.section}>
        <Text style={styles.sectionTitle}>Cards</Text>
        <Card variant="default" padding="md" style={styles.cardExample}>
          <Text>Card padrão</Text>
        </Card>
        <Card variant="elevated" padding="md" style={styles.cardExample}>
          <Text>Card elevado</Text>
        </Card>
        <Card variant="outlined" padding="md" style={styles.cardExample}>
          <Text>Card com borda</Text>
        </Card>
      </Card>

      {/* Typography */}
      <Card variant="elevated" padding="lg" style={styles.section}>
        <Text style={styles.sectionTitle}>Typography</Text>
        <Text style={TextStyles.h1}>Heading 1</Text>
        <Text style={TextStyles.h2}>Heading 2</Text>
        <Text style={TextStyles.h3}>Heading 3</Text>
        <Text style={TextStyles.title}>Title</Text>
        <Text style={TextStyles.subtitle}>Subtitle</Text>
        <Text style={TextStyles.body}>Body text</Text>
        <Text style={TextStyles.caption}>Caption text</Text>
        <Text style={TextStyles.small}>Small text</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    ...TextStyles.h1,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  cardExample: {
    marginBottom: Spacing.sm,
  },
});