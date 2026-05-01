import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Button,
  Input,
  Card,
  Colors,
  TextStyles,
  Spacing,
  BorderRadius,
} from '../../design-system';

// ─── Seção com título ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Chip de status do rebanho ───────────────────────────────────────────────
function StatusChip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Card de vaca (preview do componente real) ───────────────────────────────
function CowCardPreview({
  name,
  tag,
  breed,
  status,
}: {
  name: string;
  tag: string;
  breed: string;
  status: 'Ativa' | 'Inativa' | 'Alerta';
}) {
  const statusColor = {
    Ativa: Colors.status.active,
    Inativa: Colors.status.inactive,
    Alerta: Colors.status.alert,
  }[status];

  const statusBg = {
    Ativa: Colors.primaryLight,
    Inativa: Colors.borderLight,
    Alerta: '#fff3e0',
  }[status];

  return (
    <Card variant="outlined" padding="md" style={styles.cowCard}>
      <View style={styles.cowCardRow}>
        <View style={styles.cowAvatar}>
          <Text style={styles.cowAvatarText}>🐄</Text>
        </View>
        <View style={styles.cowInfo}>
          <Text style={styles.cowName}>{name}</Text>
          <Text style={styles.cowMeta}>Tag: {tag} · {breed}</Text>
        </View>
        <StatusChip label={status} color={statusColor} bg={statusBg} />
      </View>
    </Card>
  );
}

// ─── Card de produção (preview) ──────────────────────────────────────────────
function ProductionCard({ liters, date, cowName }: { liters: number; date: string; cowName: string }) {
  return (
    <Card variant="elevated" padding="md" style={styles.productionCard}>
      <View style={styles.productionRow}>
        <View>
          <Text style={styles.productionLabel}>Produção registrada</Text>
          <Text style={styles.productionCow}>{cowName}</Text>
          <Text style={styles.productionDate}>{date}</Text>
        </View>
        <View style={styles.productionLiters}>
          <Text style={styles.productionValue}>{liters}L</Text>
          <Text style={styles.productionUnit}>litros</Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────────────
export default function DesignShowcase() {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🐄 VacaFácil</Text>
          <Text style={styles.headerSub}>Design System — Showcase</Text>
        </View>

        {/* ── CORES ─────────────────────────────────────────────────────── */}
        <Section title="Paleta de Cores">
          <View style={styles.colorGrid}>
            {[
              { label: 'primary', color: Colors.primary },
              { label: 'primaryDark', color: Colors.primaryDark },
              { label: 'primaryLight', color: Colors.primaryLight },
              { label: 'secondary', color: Colors.secondary },
              { label: 'background', color: Colors.background },
              { label: 'surface', color: Colors.surface },
              { label: 'surfaceVariant', color: Colors.surfaceVariant },
              { label: 'border', color: Colors.border },
              { label: 'borderLight', color: Colors.borderLight },
              { label: 'error', color: Colors.error },
              { label: 'warning', color: Colors.warning },
              { label: 'success', color: Colors.success },
            ].map(({ label, color }) => (
              <View key={label} style={styles.colorItem}>
                <View style={[styles.colorSwatch, { backgroundColor: color, borderWidth: label === 'surface' || label === 'background' ? 1 : 0, borderColor: Colors.borderLight }]} />
                <Text style={styles.colorLabel}>{label}</Text>
                <Text style={styles.colorHex}>{color}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ── TIPOGRAFIA ────────────────────────────────────────────────── */}
        <Section title="Tipografia">
          <Card variant="outlined" padding="lg">
            <Text style={[TextStyles.h1, { color: Colors.textPrimary, marginBottom: Spacing.sm }]}>Heading 1 — 30px</Text>
            <Text style={[TextStyles.h2, { color: Colors.textPrimary, marginBottom: Spacing.sm }]}>Heading 2 — 24px</Text>
            <Text style={[TextStyles.h3, { color: Colors.textPrimary, marginBottom: Spacing.sm }]}>Heading 3 — 20px</Text>
            <Text style={[TextStyles.title, { color: Colors.textPrimary, marginBottom: Spacing.sm }]}>Title — 18px Semibold</Text>
            <Text style={[TextStyles.body, { color: Colors.textPrimary, marginBottom: Spacing.sm }]}>Body — 16px Regular. Texto padrão para conteúdo do app.</Text>
            <Text style={[TextStyles.caption, { color: Colors.textSecondary, marginBottom: Spacing.sm }]}>Caption — 14px. Texto auxiliar e datas.</Text>
            <Text style={[TextStyles.small, { color: Colors.textTertiary }]}>Small — 12px. Labels e hints discretos.</Text>
          </Card>
        </Section>

        {/* ── BOTÕES ────────────────────────────────────────────────────── */}
        <Section title="Botões">
          <Card variant="outlined" padding="lg" style={styles.gap}>
            <Button title="Salvar registro" onPress={() => {}} variant="primary" fullWidth />
            <Button title="Cancelar" onPress={() => {}} variant="secondary" fullWidth />
            <Button title="Ver detalhes" onPress={() => {}} variant="ghost" fullWidth />
            <Button title="Excluir vaca" onPress={() => {}} variant="danger" fullWidth />
            <Button title="Processando..." onPress={() => {}} loading fullWidth />
            <Button title="Desabilitado" onPress={() => {}} disabled fullWidth />
          </Card>

          <Text style={styles.subLabel}>Tamanhos</Text>
          <Card variant="outlined" padding="lg" style={styles.gap}>
            <View style={styles.row}>
              <Button title="Pequeno" onPress={() => {}} size="sm" style={styles.flex1} />
              <Button title="Médio" onPress={() => {}} size="md" style={styles.flex1} />
              <Button title="Grande" onPress={() => {}} size="lg" style={styles.flex1} />
            </View>
          </Card>
        </Section>

        {/* ── INPUTS ────────────────────────────────────────────────────── */}
        <Section title="Inputs">
          <Card variant="outlined" padding="lg">
            <Input
              label="Nome da vaca"
              placeholder="Ex: Mimosa"
              value={inputValue}
              onChangeText={setInputValue}
            />
            <Input
              label="Tag de identificação"
              placeholder="Ex: BR-0042"
              helperText="Número da brinco ou chip"
            />
            <Input
              label="Data de nascimento"
              placeholder="YYYY-MM-DD"
              error={inputError}
              onFocus={() => setInputError('')}
              onBlur={() => setInputError(inputValue ? '' : 'Campo obrigatório')}
            />
            <Input
              label="Observações"
              placeholder="Notas sobre a vaca..."
              multiline
              numberOfLines={3}
            />
          </Card>
        </Section>

        {/* ── CARDS ─────────────────────────────────────────────────────── */}
        <Section title="Variantes de Card">
          <Card variant="default" padding="lg" style={styles.cardGap}>
            <Text style={[TextStyles.title, { color: Colors.textPrimary }]}>Card Default</Text>
            <Text style={[TextStyles.caption, { color: Colors.textSecondary }]}>Fundo branco, sem sombra nem borda.</Text>
          </Card>
          <Card variant="elevated" padding="lg" style={styles.cardGap}>
            <Text style={[TextStyles.title, { color: Colors.textPrimary }]}>Card Elevated</Text>
            <Text style={[TextStyles.caption, { color: Colors.textSecondary }]}>Com sombra — ideal para cards de destaque.</Text>
          </Card>
          <Card variant="outlined" padding="lg" style={styles.cardGap}>
            <Text style={[TextStyles.title, { color: Colors.textPrimary }]}>Card Outlined</Text>
            <Text style={[TextStyles.caption, { color: Colors.textSecondary }]}>Com borda — ideal para listas e formulários.</Text>
          </Card>
          <Card variant="elevated" padding="lg" onPress={() => {}} style={styles.cardGap}>
            <Text style={[TextStyles.title, { color: Colors.primary }]}>Card Clicável ↗</Text>
            <Text style={[TextStyles.caption, { color: Colors.textSecondary }]}>Pressione para ver a animação de escala.</Text>
          </Card>
        </Section>

        {/* ── STATUS DO REBANHO ─────────────────────────────────────────── */}
        <Section title="Status do Rebanho">
          <View style={styles.chipRow}>
            <StatusChip label="Ativa" color={Colors.status.active} bg={Colors.primaryLight} />
            <StatusChip label="Inativa" color={Colors.status.inactive} bg={Colors.borderLight} />
            <StatusChip label="Alerta" color={Colors.status.alert} bg="#fff3e0" />
          </View>
        </Section>

        {/* ── CARD DE VACA (preview) ─────────────────────────────────────── */}
        <Section title="Card de Vaca (Preview)">
          <CowCardPreview name="Mimosa" tag="BR-0042" breed="Holandesa" status="Ativa" />
          <CowCardPreview name="Estrela" tag="BR-0078" breed="Gir Leiteiro" status="Alerta" />
          <CowCardPreview name="Pintada" tag="BR-0015" breed="Jersey" status="Inativa" />
        </Section>

        {/* ── CARD DE PRODUÇÃO (preview) ────────────────────────────────── */}
        <Section title="Registro de Produção (Preview)">
          <ProductionCard liters={28} date="20/04/2026 — manhã" cowName="Mimosa · BR-0042" />
          <ProductionCard liters={19} date="20/04/2026 — tarde" cowName="Estrela · BR-0078" />
        </Section>

        {/* ── CORES SEMÂNTICAS ──────────────────────────────────────────── */}
        <Section title="Feedback Visual">
          <Card variant="outlined" padding="md" style={[styles.feedbackCard, { borderColor: Colors.success, backgroundColor: Colors.primaryLight }]}>
            <Text style={[TextStyles.body, { color: Colors.primaryDark, fontWeight: '600' }]}>✓ Registro salvo com sucesso</Text>
            <Text style={[TextStyles.caption, { color: Colors.primaryDark }]}>Produção de 28L registrada para Mimosa.</Text>
          </Card>
          <Card variant="outlined" padding="md" style={[styles.feedbackCard, { borderColor: Colors.error, backgroundColor: '#fff0f0' }]}>
            <Text style={[TextStyles.body, { color: Colors.error, fontWeight: '600' }]}>✕ Erro ao salvar</Text>
            <Text style={[TextStyles.caption, { color: Colors.error }]}>Verifique sua conexão e tente novamente.</Text>
          </Card>
          <Card variant="outlined" padding="md" style={[styles.feedbackCard, { borderColor: Colors.warning, backgroundColor: '#fff3e0' }]}>
            <Text style={[TextStyles.body, { color: Colors.warning, fontWeight: '600' }]}>⚠ Atenção necessária</Text>
            <Text style={[TextStyles.caption, { color: Colors.warning }]}>Estrela está com produção abaixo da média.</Text>
          </Card>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>VacaFácil Design System v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    ...TextStyles.h1,
    color: Colors.onPrimary,
  },
  headerSub: {
    ...TextStyles.caption,
    color: Colors.primaryLight,
    marginTop: Spacing.xs,
  },

  // Seções
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.textPrimary,
  },
  subLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Cores
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  colorSwatch: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  colorLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  colorHex: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Botões
  gap: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },

  // Cards
  cardGap: {
    marginBottom: Spacing.sm,
  },

  // Chip de status
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Card de vaca
  cowCard: {
    marginBottom: Spacing.sm,
  },
  cowCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cowAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cowAvatarText: {
    fontSize: 22,
  },
  cowInfo: {
    flex: 1,
  },
  cowName: {
    ...TextStyles.title,
    color: Colors.textPrimary,
  },
  cowMeta: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },

  // Card de produção
  productionCard: {
    marginBottom: Spacing.sm,
  },
  productionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productionLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  productionCow: {
    ...TextStyles.title,
    color: Colors.textPrimary,
  },
  productionDate: {
    ...TextStyles.small,
    color: Colors.textTertiary,
  },
  productionLiters: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  productionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  productionUnit: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Feedback
  feedbackCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  footerText: {
    ...TextStyles.small,
    color: Colors.textTertiary,
  },
});
