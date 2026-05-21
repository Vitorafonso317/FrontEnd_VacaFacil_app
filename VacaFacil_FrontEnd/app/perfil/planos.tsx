import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/colors';

type Plan = {
  key: 'gratuito' | 'ouro' | 'diamante';
  name: string;
  price: string;
  badge: string;
  features: { label: string; included: boolean }[];
  color: string;
  btnLabel: string;
};

const PLANS: Plan[] = [
  {
    key: 'gratuito',
    name: 'Gratuito',
    price: 'R$ 0',
    badge: 'BÁSICO',
    color: colors.textSecondary,
    btnLabel: 'Plano atual',
    features: [
      { label: 'Até 5 vacas cadastradas', included: true },
      { label: 'Registro de produção', included: true },
      { label: 'Controle financeiro básico', included: true },
      { label: 'Marketplace', included: true },
      { label: 'Previsão IA avançada', included: false },
      { label: 'Relatórios exportáveis', included: false },
      { label: 'Multi-fazenda', included: false },
    ],
  },
  {
    key: 'ouro',
    name: 'Ouro',
    price: 'R$ 29,90',
    badge: 'MAIS POPULAR',
    color: '#d97706',
    btnLabel: 'Assinar Ouro',
    features: [
      { label: 'Vacas ilimitadas', included: true },
      { label: 'Registro de produção', included: true },
      { label: 'Controle financeiro completo', included: true },
      { label: 'Marketplace', included: true },
      { label: 'Previsão IA avançada', included: true },
      { label: 'Relatórios exportáveis', included: true },
      { label: 'Multi-fazenda', included: false },
    ],
  },
  {
    key: 'diamante',
    name: 'Diamante',
    price: 'R$ 59,90',
    badge: 'COMPLETO',
    color: colors.primary,
    btnLabel: 'Assinar Diamante',
    features: [
      { label: 'Tudo do Ouro', included: true },
      { label: 'Multi-fazenda', included: true },
      { label: 'API de integração', included: true },
      { label: 'Consultoria mensal', included: true },
      { label: 'Suporte prioritário 24h', included: true },
      { label: 'Relatórios customizados', included: true },
    ],
  },
];

export default function Planos() {
  const router = useRouter();
  const { user } = useAuth();
  const currentPlan = user?.plano ?? 'gratuito';

  function handleUpgrade(plan: Plan) {
    if (plan.key === currentPlan) return;
    Alert.alert(
      `Assinar ${plan.name}`,
      `Para assinar o plano ${plan.name} (${plan.price}/mês), entre em contato com nosso time.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Contato via WhatsApp',
          onPress: () => {
            const msg = encodeURIComponent(
              `Olá! Vi o app VacaFácil e tenho interesse no plano ${plan.name} (${plan.price}/mês). Poderia me ajudar com a assinatura?`
            );
            Linking.openURL(`https://wa.me/5535998589558?text=${msg}`)
              .catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={s.title}>Planos</Text>
      <Text style={s.subtitle}>Escolha o plano ideal para sua fazenda.</Text>

      {PLANS.map(plan => {
        const isCurrent = plan.key === currentPlan;
        const isGold = plan.key === 'ouro';
        return (
          <View
            key={plan.key}
            style={[
              s.card,
              isCurrent && s.cardCurrent,
              isGold && !isCurrent && s.cardHighlight,
            ]}
          >
            <View style={s.cardTop}>
              <View style={[s.badge, { backgroundColor: plan.color + '22' }]}>
                <Text style={[s.badgeText, { color: plan.color }]}>{plan.badge}</Text>
              </View>
              {isCurrent && (
                <View style={s.activeTag}>
                  <MaterialIcons name="check-circle" size={14} color={colors.primary} />
                  <Text style={s.activeTagText}>Ativo</Text>
                </View>
              )}
            </View>

            <Text style={s.planName}>{plan.name}</Text>
            <View style={s.priceRow}>
              <Text style={[s.price, { color: plan.color === colors.textSecondary ? colors.text : plan.color }]}>
                {plan.price}
              </Text>
              <Text style={s.pricePer}>/mês</Text>
            </View>

            <View style={s.features}>
              {plan.features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <MaterialIcons
                    name={f.included ? 'check' : 'close'}
                    size={16}
                    color={f.included ? colors.primary : colors.border}
                  />
                  <Text style={[s.featureText, !f.included && s.featureOff]}>
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                s.btn,
                isCurrent ? s.btnCurrent : { backgroundColor: plan.color === colors.textSecondary ? colors.border : plan.color },
              ]}
              onPress={() => handleUpgrade(plan)}
              disabled={isCurrent}
              activeOpacity={0.85}
            >
              <Text style={[s.btnText, isCurrent && s.btnTextCurrent]}>
                {isCurrent ? 'Plano atual' : plan.btnLabel}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={s.footer}>
        Dúvidas? Fale com nosso time pelo suporte@vacafacil.com.br
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 32, paddingBottom: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },

  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight,
    padding: 20, marginBottom: 16, gap: 12,
  },
  cardCurrent: { borderColor: colors.primary, borderWidth: 2 },
  cardHighlight: { borderColor: '#d97706', borderWidth: 2 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeTagText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  planName: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  pricePer: { fontSize: 14, color: colors.textSecondary },

  features: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: colors.text, flex: 1 },
  featureOff: { color: colors.border },

  btn: {
    height: 48, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnCurrent: { backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.borderLight },
  btnText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  btnTextCurrent: { color: colors.textSecondary },

  footer: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: 8 },
});
