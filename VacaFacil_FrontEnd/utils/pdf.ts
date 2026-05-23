import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Cow, ProductionRecord, FinancialRecord, ReproducaoEvent, Medicamento } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Base HTML wrapper ────────────────────────────────────────────────────────

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #181d17; background: #fff; padding: 32px; }
  .logo { color: #0d631b; font-size: 22px; font-weight: 700; margin-bottom: 2px; }
  .meta { color: #707a6c; font-size: 11px; margin-bottom: 20px; }
  hr { border: none; border-top: 2px solid #0d631b; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th {
    background: #0d631b; color: #fff; text-align: left;
    padding: 8px 10px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #e5eadf; font-size: 11.5px; }
  tbody tr:nth-child(even) { background: #f7fbf0; }
  .summary {
    background: #f1f5eb; border: 1px solid #bfcaba;
    border-radius: 6px; padding: 14px 16px; margin-top: 4px;
  }
  .sum-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
  .sum-lbl { color: #40493d; }
  .sum-val { font-weight: 700; color: #0d631b; }
  .sum-val.neg { color: #ba1a1a; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .b-ativa { background: #cbffc2; color: #0d631b; }
  .b-seca { background: #e0e4da; color: #40493d; }
  .b-trat { background: #ffdad6; color: #ba1a1a; }
  .section { color: #0d631b; font-size: 13px; font-weight: 700; margin: 20px 0 8px; padding-left: 8px; border-left: 3px solid #0d631b; }
  .positive { color: #0d631b; font-weight: 700; }
  .negative { color: #ba1a1a; font-weight: 700; }
  .empty { color: #707a6c; font-style: italic; padding: 12px 0; }
`;

function template(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${CSS}</style></head><body>${content}</body></html>`;
}

// ─── Exportar ────────────────────────────────────────────────────────────────

export async function exportPdf(html: string, filename: string) {
  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Compartilhar ${filename}`,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (e: any) {
    Alert.alert('Erro ao gerar PDF', e?.message ?? 'Tente novamente.');
  }
}

// ─── Relatório de Rebanho ─────────────────────────────────────────────────────

export function buildCowsReport(cows: Cow[], userName: string): string {
  const today = new Date().toLocaleDateString('pt-BR');

  const ativas = cows.filter(c => {
    const s = c.status_saude?.toLowerCase() ?? '';
    return s === 'ativa' || s === 'saudavel' || s === '';
  }).length;
  const secas = cows.filter(c => c.status_saude?.toLowerCase() === 'seca').length;
  const tratamento = cows.filter(c => c.status_saude?.toLowerCase() === 'tratamento').length;

  const rows = cows.map(c => {
    const s = c.status_saude?.toLowerCase() ?? 'ativa';
    const [cls, label] =
      s === 'tratamento' ? ['b-trat', 'Tratamento'] :
      s === 'seca'       ? ['b-seca', 'Seca'] :
                           ['b-ativa', 'Ativa'];
    return `<tr>
      <td>${c.nome}</td>
      <td>${c.raca ?? '—'}</td>
      <td>${c.idade ? c.idade + ' anos' : '—'}</td>
      <td>${c.peso ? c.peso + ' kg' : '—'}</td>
      <td><span class="badge ${cls}">${label}</span></td>
    </tr>`;
  }).join('');

  return template(`
    <p class="logo">VacaFácil</p>
    <p class="meta">Relatório do Rebanho &bull; Gerado em ${today} &bull; ${userName}</p>
    <hr/>
    ${cows.length === 0
      ? '<p class="empty">Nenhuma vaca cadastrada.</p>'
      : `<table>
           <thead><tr>
             <th>Nome</th><th>Raça</th><th>Idade</th><th>Peso</th><th>Status</th>
           </tr></thead>
           <tbody>${rows}</tbody>
         </table>
         <div class="summary">
           <div class="sum-row"><span class="sum-lbl">Total de Cabeças</span><span class="sum-val">${cows.length}</span></div>
           <div class="sum-row"><span class="sum-lbl">Ativas</span><span class="sum-val">${ativas}</span></div>
           <div class="sum-row"><span class="sum-lbl">Secas</span><span class="sum-val">${secas}</span></div>
           <div class="sum-row"><span class="sum-lbl">Em Tratamento</span><span class="sum-val">${tratamento}</span></div>
         </div>`
    }
  `);
}

// ─── Relatório de Produção ────────────────────────────────────────────────────

export function buildProductionReport(
  records: ProductionRecord[],
  cowMap: Record<number, string>,
  userName: string,
): string {
  const today = new Date().toLocaleDateString('pt-BR');

  const total = records.reduce((acc, r) => acc + (r.litros ?? 0), 0);
  const vacasUnicas = new Set(records.map(r => r.vaca_id)).size;
  const media = records.length > 0 ? (total / records.length).toFixed(1) : '0';

  const rows = records.map(r => `
    <tr>
      <td>${fmtDate(r.data)}</td>
      <td>${cowMap[r.vaca_id] ?? `Vaca #${r.vaca_id}`}</td>
      <td><strong>${r.litros} L</strong></td>
      <td>${r.observacoes ?? '—'}</td>
    </tr>
  `).join('');

  return template(`
    <p class="logo">VacaFácil</p>
    <p class="meta">Relatório de Produção &bull; Gerado em ${today} &bull; ${userName}</p>
    <hr/>
    ${records.length === 0
      ? '<p class="empty">Nenhum registro de produção.</p>'
      : `<table>
           <thead><tr>
             <th>Data</th><th>Vaca</th><th>Litros</th><th>Observações</th>
           </tr></thead>
           <tbody>${rows}</tbody>
         </table>
         <div class="summary">
           <div class="sum-row"><span class="sum-lbl">Total de Litros</span><span class="sum-val">${total.toLocaleString('pt-BR')} L</span></div>
           <div class="sum-row"><span class="sum-lbl">Média por Registro</span><span class="sum-val">${media} L</span></div>
           <div class="sum-row"><span class="sum-lbl">Vacas com Registro</span><span class="sum-val">${vacasUnicas}</span></div>
           <div class="sum-row"><span class="sum-lbl">Total de Registros</span><span class="sum-val">${records.length}</span></div>
         </div>`
    }
  `);
}

// ─── Ficha Completa da Vaca ───────────────────────────────────────────────────

export function buildCowReport(
  cow: Cow,
  producao: ProductionRecord[],
  reproducao: ReproducaoEvent[],
  tratamento: Medicamento | null | undefined,
  userName: string,
): string {
  const today = new Date().toLocaleDateString('pt-BR');

  const STATUS_LABEL: Record<string, [string, string]> = {
    saudavel:   ['b-ativa', 'Ativa'],
    ativa:      ['b-ativa', 'Ativa'],
    seca:       ['b-seca',  'Seca'],
    tratamento: ['b-trat',  'Tratamento'],
  };
  const [stCls, stLabel] = STATUS_LABEL[cow.status_saude?.toLowerCase() ?? ''] ?? ['b-ativa', 'Ativa'];

  const totalLitros = producao.reduce((s, r) => s + (r.litros ?? 0), 0);
  const mediaLitros = producao.length ? (totalLitros / producao.length).toFixed(1) : '—';

  const insem = [...reproducao]
    .filter(e => e.tipo_evento?.toLowerCase().includes('insemina'))
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  let partoHtml = '';
  if (insem) {
    const [y, m, d] = insem.data.split('-').map(Number);
    const partoDate = new Date(y, m - 1, d + 283);
    const dias = Math.ceil((partoDate.getTime() - Date.now()) / 86_400_000);
    const label = dias < 0
      ? `<span style="color:#ba1a1a">Atrasado ${Math.abs(dias)} dias (${partoDate.toLocaleDateString('pt-BR')})</span>`
      : dias === 0
        ? `<span style="color:#0d631b"><strong>Hoje!</strong></span>`
        : `Em <strong>${dias} dias</strong> — ${partoDate.toLocaleDateString('pt-BR')}`;
    partoHtml = `<div class="sum-row"><span class="sum-lbl">Parto Previsto</span><span>${label}</span></div>`;
  }

  const carenciaHtml = tratamento
    ? `<div style="background:#ffdad6;border:1px solid #ba1a1a;border-radius:6px;padding:10px 14px;margin-bottom:16px;">
         <strong style="color:#ba1a1a">EM CARÊNCIA — LEITE DESCARTÁVEL</strong><br/>
         <span style="font-size:12px;">${tratamento.nome_medicamento} · liberado em ${new Date(tratamento.data_fim_carencia + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
       </div>`
    : '';

  const prodRows = producao.map(r => `
    <tr>
      <td>${fmtDate(r.data)}</td>
      <td><strong>${r.litros} L</strong></td>
      <td>${r.observacoes ?? '—'}</td>
    </tr>
  `).join('');

  const reproRows = reproducao.map(e => `
    <tr>
      <td>${fmtDate(e.data)}</td>
      <td>${e.tipo_evento}</td>
      <td>${e.observacoes ?? '—'}</td>
    </tr>
  `).join('');

  return template(`
    <p class="logo">VacaFácil</p>
    <p class="meta">Ficha da Vaca &bull; Gerado em ${today} &bull; ${userName}</p>
    <hr/>

    <div class="summary" style="margin-bottom:16px;">
      <div class="sum-row">
        <span class="sum-lbl">Nome</span>
        <span class="sum-val">${cow.nome}</span>
      </div>
      <div class="sum-row">
        <span class="sum-lbl">Raça</span>
        <span>${cow.raca ?? '—'}</span>
      </div>
      <div class="sum-row">
        <span class="sum-lbl">Idade / Peso</span>
        <span>${cow.idade != null ? cow.idade + ' anos' : '—'} / ${cow.peso != null ? cow.peso + ' kg' : '—'}</span>
      </div>
      <div class="sum-row">
        <span class="sum-lbl">Status</span>
        <span><span class="badge ${stCls}">${stLabel}</span></span>
      </div>
      ${partoHtml}
    </div>

    ${carenciaHtml}

    <p class="section">Produção de Leite</p>
    ${producao.length === 0
      ? '<p class="empty">Nenhum registro de produção.</p>'
      : `<table>
           <thead><tr><th>Data</th><th>Litros</th><th>Observações</th></tr></thead>
           <tbody>${prodRows}</tbody>
         </table>
         <div class="summary">
           <div class="sum-row"><span class="sum-lbl">Total de Registros</span><span class="sum-val">${producao.length}</span></div>
           <div class="sum-row"><span class="sum-lbl">Total de Litros</span><span class="sum-val">${totalLitros.toLocaleString('pt-BR')} L</span></div>
           <div class="sum-row"><span class="sum-lbl">Média por Registro</span><span class="sum-val">${mediaLitros} L</span></div>
         </div>`
    }

    <p class="section">Eventos Reprodutivos</p>
    ${reproducao.length === 0
      ? '<p class="empty">Nenhum evento registrado.</p>'
      : `<table>
           <thead><tr><th>Data</th><th>Evento</th><th>Observações</th></tr></thead>
           <tbody>${reproRows}</tbody>
         </table>`
    }
  `);
}

// ─── Relatório Financeiro ─────────────────────────────────────────────────────

export function buildFinancialReport(
  receitas: FinancialRecord[],
  despesas: FinancialRecord[],
  userName: string,
): string {
  const today = new Date().toLocaleDateString('pt-BR');

  const totalReceitas = receitas.reduce((acc, r) => acc + (r.valor ?? 0), 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0);
  const saldo = totalReceitas - totalDespesas;

  const receitaRows = receitas.map(r => `
    <tr>
      <td>${fmtDate(r.data)}</td>
      <td>${r.descricao}</td>
      <td class="positive">${fmtCurrency(r.valor)}</td>
    </tr>
  `).join('');

  const despesaRows = despesas.map(d => `
    <tr>
      <td>${fmtDate(d.data)}</td>
      <td>${d.descricao}</td>
      <td class="negative">- ${fmtCurrency(d.valor)}</td>
    </tr>
  `).join('');

  return template(`
    <p class="logo">VacaFácil</p>
    <p class="meta">Relatório Financeiro &bull; Gerado em ${today} &bull; ${userName}</p>
    <hr/>

    <p class="section">Entradas (Receitas)</p>
    ${receitas.length === 0
      ? '<p class="empty">Nenhuma receita registrada.</p>'
      : `<table>
           <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
           <tbody>${receitaRows}</tbody>
         </table>`
    }

    <p class="section">Saídas (Despesas)</p>
    ${despesas.length === 0
      ? '<p class="empty">Nenhuma despesa registrada.</p>'
      : `<table>
           <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
           <tbody>${despesaRows}</tbody>
         </table>`
    }

    <div class="summary">
      <div class="sum-row"><span class="sum-lbl">Total de Entradas</span><span class="sum-val">${fmtCurrency(totalReceitas)}</span></div>
      <div class="sum-row"><span class="sum-lbl">Total de Saídas</span><span class="sum-val neg">${fmtCurrency(totalDespesas)}</span></div>
      <div class="sum-row" style="border-top:1px solid #bfcaba;margin-top:6px;padding-top:6px;">
        <span class="sum-lbl" style="font-weight:700;">Saldo</span>
        <span class="sum-val ${saldo < 0 ? 'neg' : ''}" style="font-size:14px;">${fmtCurrency(saldo)}</span>
      </div>
    </div>
  `);
}
