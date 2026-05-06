// ============================================================
//  LABORATÓRIO DE ARRENDAMENTO — Contabilidade Financeira II
//  Cálculos: TIR, amortização, BP, DRE, DFC + Quiz CPCs
// ============================================================

// ---------- helpers ----------
const fmt = (v, dec = 0) => {
  if (v === null || v === undefined || isNaN(v)) return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const fmtPct = (v, dec = 4) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%';
const round = (v, dec = 0) => Math.round(v * Math.pow(10, dec)) / Math.pow(10, dec);

// Newton-Raphson para TIR
function calcularTIR(fluxos, palpite = 0.01) {
  let r = palpite;
  for (let it = 0; it < 200; it++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < fluxos.length; t++) {
      npv += fluxos[t] / Math.pow(1 + r, t);
      dnpv += -t * fluxos[t] / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const nr = r - npv / dnpv;
    if (Math.abs(nr - r) < 1e-12) return nr;
    r = nr;
  }
  return r;
}

// Gera tabela de amortização (mensal ou anual, conforme params)
function gerarTabelaFinanceira(valor, pgto, n, residual, taxa) {
  let saldo = valor;
  const linhas = [{ t: 0, fluxo: -valor, divida: valor, juros: 0, amort: 0 }];
  for (let i = 1; i <= n; i++) {
    const juros = saldo * taxa;
    const fluxoMes = (i === n) ? pgto + residual : pgto;
    const amort = fluxoMes - juros;
    const saldoNovo = saldo - amort;
    linhas.push({
      t: i,
      fluxo: fluxoMes,
      divida: saldoNovo,
      juros: juros,
      amort: amort
    });
    saldo = saldoNovo;
  }
  return linhas;
}

// Agrega tabela mensal em totais anuais
function agregarAnual(tabela, mesesPorAno = 12) {
  const anos = [];
  for (let a = 0; a < Math.ceil((tabela.length - 1) / mesesPorAno); a++) {
    const ini = a * mesesPorAno + 1;
    const fim = Math.min((a + 1) * mesesPorAno, tabela.length - 1);
    let pgtoTotal = 0, jurosTotal = 0, amortTotal = 0;
    for (let m = ini; m <= fim; m++) {
      pgtoTotal += tabela[m].fluxo;
      jurosTotal += tabela[m].juros;
      amortTotal += tabela[m].amort;
    }
    anos.push({
      ano: a + 1,
      pgtoTotal: round(pgtoTotal),
      jurosTotal: round(jurosTotal),
      amortTotal: round(amortTotal),
      saldoFim: round(tabela[fim].divida)
    });
  }
  return anos;
}

// ============================================================
//  DADOS DAS 5 VARIAÇÕES
// ============================================================
const variacoes = [
  // ----- VAR 1: RESIDE (anual completo) -----
  {
    id: 1,
    nivel: 'iniciante',
    tipo: 'completo',
    titulo: 'Cia RESIDE — Edifício',
    cenario: 'BP+DRE+DFC · pagamentos anuais',
    enunciado: 'O balanço da <strong>Cia RESIDE</strong> em <strong>31/12/X4</strong> apresenta: <em>Disponibilidade R$ 20.000 · PL R$ 20.000</em>. A empresa pretende adquirir um <strong>Edifício</strong> com valor à vista de <strong>R$ 50.000</strong> e vida útil de <strong>4 anos</strong>, do qual espera receitas anuais (em caixa) de <strong>R$ 30.000</strong>. O contrato de arrendamento prevê <strong>3 pagamentos anuais de R$ 20.000</strong> e <strong>valor residual de R$ 3.000</strong> a pagar com a última parcela. Pede-se: identificar a taxa implícita do contrato, montar BP, DRE e DFC anuais até o fim da vida útil, comparando o cenário com arrendamento e o cenário com aluguel (em que o desembolso anual coincide com o total que seria pago no arrendamento — desconsidere impostos).',
    bpInicial: { caixa: 20000, capital: 20000 },
    valor: 50000, pgto: 20000, n: 3, residual: 3000,
    frequencia: 'anual',
    vidaUtil: 4,
    receitaPorPeriodo: 30000,
    inicio: 'X4'
  },

  // ----- VAR 2: ALPHA - completo anual (mais simples que mensal) -----
  {
    id: 2,
    nivel: 'básico',
    tipo: 'completo',
    titulo: 'Cia ALPHA — Linha de produção',
    cenario: 'BP+DRE+DFC · pagamentos anuais',
    enunciado: 'O balanço da <strong>Cia ALPHA</strong> em <strong>31/12/X4</strong> apresenta: <em>Disponibilidade R$ 25.000 · PL R$ 25.000</em>. A empresa pretende adquirir uma <strong>linha de produção</strong> no valor à vista de <strong>R$ 60.000</strong> com vida útil de <strong>3 anos</strong>, da qual espera receitas anuais (em caixa) de <strong>R$ 28.000</strong>. O arrendamento prevê <strong>3 pagamentos anuais de R$ 22.000</strong> e <strong>valor residual de R$ 1.500</strong> com a última parcela. Pede-se: montar BP, DRE e DFC anuais até o fim da vida útil, considerando os cenários de <em>arrendamento</em> e de <em>aluguel</em> (em que o pagamento total ao locador no ano coincide com o total que seria pago no arrendamento — desconsidere impostos).',
    bpInicial: { caixa: 25000, capital: 25000 },
    valor: 60000, pgto: 22000, n: 3, residual: 1500,
    frequencia: 'anual',
    vidaUtil: 3,
    receitaPorPeriodo: 28000,
    inicio: 'X4'
  },

  // ----- VAR 3: caso PDF original (XYZ) - mensal completo -----
  {
    id: 3,
    nivel: 'intermediário',
    tipo: 'completo',
    titulo: 'Cia XYZ — Máquina industrial',
    cenario: 'Caso clássico do PDF · 24 meses',
    enunciado: 'O balanço da <strong>Cia XYZ</strong> em <strong>31/12/X4</strong> apresenta: <em>Disponibilidade R$ 5.000 · PL R$ 5.000</em>. Pretende adquirir uma <strong>máquina</strong> com valor de mercado de <strong>R$ 10.000</strong> e vida útil de <strong>3 anos</strong>; receitas mensais (em caixa) estimadas em <strong>R$ 800</strong>. O arrendamento: <strong>24 pagamentos mensais de R$ 500</strong> + <strong>valor residual de R$ 120</strong> com a última parcela. Pede-se: montar BP, DRE e DFC anuais até o fim da vida útil, comparando arrendamento e aluguel.',
    bpInicial: { caixa: 5000, capital: 5000 },
    valor: 10000, pgto: 500, n: 24, residual: 120,
    frequencia: 'mensal',
    vidaUtil: 3,
    receitaPorPeriodo: 800,    // mensal
    inicio: 'X4'
  },

  // ----- VAR 4: TechCorp servidor -----
  {
    id: 4,
    nivel: 'intermediário',
    tipo: 'completo',
    titulo: 'TechCorp — Servidor de dados',
    cenario: 'BP+DRE+DFC · 24 meses',
    enunciado: 'O balanço da <strong>TechCorp</strong> em <strong>31/12/X4</strong> apresenta: <em>Disponibilidade R$ 12.000 · PL R$ 12.000</em>. A empresa pretende adquirir um <strong>servidor</strong> com valor à vista de <strong>R$ 30.000</strong> e vida útil de <strong>4 anos</strong>; receitas mensais de <strong>R$ 2.500</strong>. O arrendamento: <strong>24 pagamentos mensais de R$ 1.400</strong> + <strong>valor residual de R$ 800</strong>. Pede-se: BP, DRE e DFC anuais até o fim da vida útil.',
    bpInicial: { caixa: 12000, capital: 12000 },
    valor: 30000, pgto: 1400, n: 24, residual: 800,
    frequencia: 'mensal',
    vidaUtil: 4,
    receitaPorPeriodo: 2500,
    inicio: 'X4'
  },

  // ----- VAR 5: Cia VELOZ caminhão (mais longo) -----
  {
    id: 5,
    nivel: 'avançado',
    tipo: 'completo',
    titulo: 'Cia VELOZ — Frota de caminhões',
    cenario: 'BP+DRE+DFC · 36 meses',
    enunciado: 'O balanço da <strong>Cia VELOZ</strong> em <strong>31/12/X4</strong> apresenta: <em>Disponibilidade R$ 30.000 · PL R$ 30.000</em>. A empresa pretende adquirir um <strong>caminhão</strong> com valor à vista de <strong>R$ 80.000</strong> e vida útil de <strong>5 anos</strong>; receitas mensais de <strong>R$ 5.000</strong>. O arrendamento: <strong>36 pagamentos mensais de R$ 2.500</strong> + <strong>valor residual de R$ 1.500</strong>. Pede-se: BP, DRE e DFC anuais até o fim da vida útil.',
    bpInicial: { caixa: 30000, capital: 30000 },
    valor: 80000, pgto: 2500, n: 36, residual: 1500,
    frequencia: 'mensal',
    vidaUtil: 5,
    receitaPorPeriodo: 5000,
    inicio: 'X4'
  }
];

// ============================================================
//  CALCULAR GABARITO PARA UMA VARIAÇÃO
// ============================================================
function calcularGabarito(v) {
  // 1) TIR
  const fluxos = [-v.valor];
  for (let i = 1; i <= v.n; i++) {
    fluxos.push(i === v.n ? v.pgto + v.residual : v.pgto);
  }
  const tir = calcularTIR(fluxos, 0.01);

  // 2) Tabela financeira
  const tabela = gerarTabelaFinanceira(v.valor, v.pgto, v.n, v.residual, tir);

  // 3) Para tipo simples: depreciação ano a ano
  const depreciacaoAnual = round(v.valor / v.vidaUtil);
  const depTabela = [];
  for (let a = 0; a <= v.vidaUtil; a++) {
    depTabela.push({
      ano: a,
      vrBem: v.valor,
      depAcum: a === 0 ? 0 : Math.min(depreciacaoAnual * a, v.valor),
      vrContabil: a === 0 ? v.valor : Math.max(v.valor - depreciacaoAnual * a, 0)
    });
  }

  // 4) Para tipo completo: agregação anual + BP/DRE/DFC
  let anosFin = null, bp = null, dre = null, dfc = null, bpAluguel = null, dreAluguel = null, dfcAluguel = null;

  if (v.tipo === 'completo') {
    const mesesPorAno = v.frequencia === 'mensal' ? 12 : 1;
    anosFin = agregarAnual(tabela, mesesPorAno);

    // Receita anual
    const receitaAnual = v.frequencia === 'mensal' ? v.receitaPorPeriodo * 12 : v.receitaPorPeriodo;
    const depAnual = v.valor / v.vidaUtil;

    const numAnos = v.vidaUtil;

    // ----- DRE (anos 1..vidaUtil) -----
    dre = [];
    for (let a = 0; a < numAnos; a++) {
      const desp = anosFin[a] ? anosFin[a].jurosTotal : 0;
      dre.push({
        ano: a + 1,
        receitas: receitaAnual,
        depreciacao: round(depAnual),
        despFin: round(desp),
        lucroLiq: round(receitaAnual - depAnual - desp)
      });
    }

    // ----- BP -----
    // Datas: 31/12/X4 (inicial), 1/jan/X5 (logo após assumir), 31/12/X5, ..., 31/12/X{4+n}
    bp = [];
    bp.push({
      data: `31/12/${v.inicio}`,
      caixa: v.bpInicial.caixa,
      maquinas: 0,
      depAcum: 0,
      arrCP: 0,
      arrLP: 0,
      jurosCP: 0,
      jurosLP: 0,
      capital: v.bpInicial.capital,
      reservas: 0,
      ativoTotal: v.bpInicial.caixa,
      passivoPLTotal: v.bpInicial.capital
    });

    // Logo após assumir o arrendamento (1/jan/X5)
    // Passivo bruto = soma dos pgtos futuros (incluindo residual)
    const totalPgtosFuturos = v.pgto * v.n + v.residual;
    // CP do 1º momento = pgtos do próximo ano (12 mensais ou 1 anual)
    let cpBruto1 = 0, lpBruto1 = totalPgtosFuturos;
    let jurosCP1 = 0, jurosLP1 = 0;
    if (v.frequencia === 'mensal') {
      // 12 primeiros pagamentos
      for (let m = 1; m <= Math.min(12, v.n); m++) {
        cpBruto1 += tabela[m].fluxo;
        jurosCP1 += tabela[m].juros;
      }
      lpBruto1 = totalPgtosFuturos - cpBruto1;
      // juros LP = soma dos juros mes 13+
      for (let m = 13; m <= v.n; m++) jurosLP1 += tabela[m].juros;
    } else {
      cpBruto1 = tabela[1].fluxo;
      jurosCP1 = tabela[1].juros;
      lpBruto1 = totalPgtosFuturos - cpBruto1;
      for (let m = 2; m <= v.n; m++) jurosLP1 += tabela[m].juros;
    }

    bp.push({
      data: `1/jan/${incrAno(v.inicio, 1)}`,
      caixa: v.bpInicial.caixa,
      maquinas: v.valor,
      depAcum: 0,
      arrCP: round(cpBruto1),
      arrLP: round(lpBruto1),
      jurosCP: round(jurosCP1),
      jurosLP: round(jurosLP1),
      capital: v.bpInicial.capital,
      reservas: 0,
      ativoTotal: round(v.bpInicial.caixa + v.valor),
      passivoPLTotal: round((cpBruto1 - jurosCP1) + (lpBruto1 - jurosLP1) + v.bpInicial.capital)
    });

    // Para os demais BPs, calcular ano a ano
    let caixa = v.bpInicial.caixa;
    let reservasAcum = 0;
    for (let a = 0; a < numAnos; a++) {
      const dreA = dre[a];
      const finA = anosFin[a] || { pgtoTotal: 0, jurosTotal: 0, amortTotal: 0 };
      // Caixa: + receitas - pgto total do ano
      caixa = caixa + dreA.receitas - (finA.pgtoTotal || 0);
      reservasAcum += dreA.lucroLiq;

      const depAcumA = round(depAnual * (a + 1));

      // Calcular CP e LP para o próximo ano
      let cpBruto = 0, lpBruto = 0, jurosCPx = 0, jurosLPx = 0;
      if (a + 1 < numAnos && v.tipo === 'completo') {
        // Início mês do próximo ano = a+1, em meses = (a+1)*12 + 1
        const proxMesIni = (a + 1) * (v.frequencia === 'mensal' ? 12 : 1) + 1;
        const proxMesFim = Math.min(proxMesIni + (v.frequencia === 'mensal' ? 11 : 0), v.n);
        for (let m = proxMesIni; m <= proxMesFim; m++) {
          cpBruto += tabela[m].fluxo;
          jurosCPx += tabela[m].juros;
        }
        for (let m = proxMesFim + 1; m <= v.n; m++) {
          lpBruto += tabela[m].fluxo;
          jurosLPx += tabela[m].juros;
        }
      }

      bp.push({
        data: `31/12/${incrAno(v.inicio, a + 1)}`,
        caixa: round(caixa),
        maquinas: v.valor,
        depAcum: depAcumA,
        arrCP: round(cpBruto),
        arrLP: round(lpBruto),
        jurosCP: round(jurosCPx),
        jurosLP: round(jurosLPx),
        capital: v.bpInicial.capital,
        reservas: round(reservasAcum),
        ativoTotal: round(caixa + v.valor - depAcumA),
        passivoPLTotal: round((cpBruto - jurosCPx) + (lpBruto - jurosLPx) + v.bpInicial.capital + reservasAcum)
      });
    }

    // ----- DFC -----
    dfc = [];
    for (let a = 0; a < numAnos; a++) {
      const dreA = dre[a];
      const finA = anosFin[a] || { pgtoTotal: 0, jurosTotal: 0, amortTotal: 0 };
      const lucroAjust = dreA.lucroLiq + dreA.depreciacao + dreA.despFin;
      const fluxoFin = -finA.pgtoTotal;
      const saldoVar = lucroAjust + fluxoFin;
      dfc.push({
        ano: a + 1,
        lucroLiq: dreA.lucroLiq,
        depreciacao: dreA.depreciacao,
        despFin: dreA.despFin,
        caixaOper: round(lucroAjust),
        pgtoJuros: round(-finA.jurosTotal),
        pgtoPrincipal: round(-finA.amortTotal),
        caixaFin: round(fluxoFin),
        saldo: round(saldoVar)
      });
    }

    // ----- ALUGUEL (cenário comparativo) -----
    // Aluguel = pagamentos anuais (totais) que seriam feitos no arrendamento
    bpAluguel = [];
    dreAluguel = [];
    dfcAluguel = [];
    let caixaAlu = v.bpInicial.caixa;
    let reservasAlu = 0;

    bpAluguel.push({
      data: `31/12/${v.inicio}`,
      caixa: v.bpInicial.caixa,
      capital: v.bpInicial.capital,
      reservas: 0,
      ativoTotal: v.bpInicial.caixa,
      passivoPLTotal: v.bpInicial.capital
    });

    for (let a = 0; a < numAnos; a++) {
      const desplA = anosFin[a] ? anosFin[a].pgtoTotal : 0;  // valor total pago no ano
      const lucroAlu = round(receitaAnual - desplA);
      caixaAlu = caixaAlu + receitaAnual - desplA;
      reservasAlu += lucroAlu;

      dreAluguel.push({
        ano: a + 1,
        receitas: receitaAnual,
        despAluguel: round(desplA),
        lucroLiq: lucroAlu
      });
      dfcAluguel.push({
        ano: a + 1,
        lucroLiq: lucroAlu,
        caixaOper: lucroAlu,
        saldo: lucroAlu
      });
      bpAluguel.push({
        data: `31/12/${incrAno(v.inicio, a + 1)}`,
        caixa: round(caixaAlu),
        capital: v.bpInicial.capital,
        reservas: round(reservasAlu),
        ativoTotal: round(caixaAlu),
        passivoPLTotal: round(v.bpInicial.capital + reservasAlu)
      });
    }
  }

  return { tir, tabela, depTabela, depreciacaoAnual, anosFin, bp, dre, dfc, bpAluguel, dreAluguel, dfcAluguel };
}

function incrAno(inicio, n) {
  // Aceita 'X4' → 'X5'... ou '00' → '01'...
  const m = inicio.match(/^(X?)(\d+)$/);
  if (!m) return inicio;
  const prefix = m[1];
  const num = parseInt(m[2], 10) + n;
  const numStr = String(num).padStart(m[2].length, '0');
  return prefix + numStr;
}

// ============================================================
//  RENDERIZAÇÃO
// ============================================================
function renderPicker() {
  const el = document.getElementById('picker');
  el.innerHTML = variacoes.map((v, i) => `
    <div class="card ${i === 0 ? 'active' : ''}" data-id="${v.id}">
      <div class="card-tag">Variação ${v.id} · ${v.nivel}</div>
      <div class="card-title">${v.titulo}</div>
      <div class="card-meta">${v.cenario}</div>
    </div>
  `).join('');
  el.querySelectorAll('.card').forEach(c => {
    c.addEventListener('click', () => {
      el.querySelectorAll('.card').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      mostrarExercicio(parseInt(c.dataset.id, 10));
    });
  });
}

function inputCell(id, dec = 0) {
  // input com data-correct preenchido posteriormente
  return `<input class="cell" type="text" inputmode="decimal" data-id="${id}" data-dec="${dec}" />`;
}

function givenCell(value, dec = 0) {
  return `<td><input class="cell given" type="text" value="${fmt(value, dec)}" readonly /></td>`;
}

function tabelaFinanceiraHTML(v, gab, idPrefix) {
  // Mostra mês a mês (ou ano a ano), igual ao PDF
  const isMensal = v.frequencia === 'mensal';
  const total = v.n;
  // Linha 0 (saldo inicial = valor do bem) é dada
  let rows = `
    <tr>
      <td>${isMensal ? '0 (início)' : `31/12/${v.inicio}`}</td>
      ${givenCell(-v.valor)}
      ${givenCell(v.valor)}
      ${givenCell(0)}
      ${givenCell(0)}
    </tr>`;
  for (let i = 1; i <= total; i++) {
    const periodo = isMensal ? `mês ${i}` : `31/12/${incrAno(v.inicio, i)}`;
    rows += `
      <tr>
        <td>${periodo}</td>
        <td>${inputCell(`${idPrefix}_fluxo_${i}`)}</td>
        ${i === total ? givenCell(0) : `<td>${inputCell(`${idPrefix}_saldo_${i}`)}</td>`}
        <td>${inputCell(`${idPrefix}_juros_${i}`)}</td>
        <td>${inputCell(`${idPrefix}_amort_${i}`)}</td>
      </tr>`;
  }
  return `
    <h4>Tabela financeira (amortização do passivo)</h4>
    <p style="font-size:.88rem;color:var(--ink-soft);">Para cada período: <strong>Juros</strong> = saldo anterior × taxa; <strong>Amortização</strong> = pagamento − juros; <strong>Saldo</strong> = saldo anterior − amortização. O saldo zera no final.</p>
    <div class="tbl-wrap">
    <table class="acc compact">
      <thead><tr><th>Período</th><th>Pagamento</th><th>Saldo da dívida</th><th>Juros</th><th>Amortização</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

function tabelaBPHTML(v, gab, idPrefix) {
  // Colunas = datas em gab.bp
  const cols = gab.bp.map(b => b.data);
  const linhas = [
    { lbl: 'ATIVO', section: true },
    { lbl: 'Disponível / Caixa', key: 'caixa' },
    { lbl: 'Máquinas / Edifícios', key: 'maquinas' },
    { lbl: '(−) Depreciação acumulada', key: 'depAcum', sinal: -1 },
    { lbl: 'ATIVO TOTAL', key: 'ativoTotal', total: true },
    { lbl: 'PASSIVO + PL', section: true },
    { lbl: 'Arrendamento CP (bruto)', key: 'arrCP' },
    { lbl: '(−) Juros a transcorrer CP', key: 'jurosCP', sinal: -1 },
    { lbl: 'Arrendamento LP (bruto)', key: 'arrLP' },
    { lbl: '(−) Juros a transcorrer LP', key: 'jurosLP', sinal: -1 },
    { lbl: 'Capital social', key: 'capital' },
    { lbl: 'Reserva de lucros', key: 'reservas' },
    { lbl: 'PASSIVO + PL TOTAL', key: 'passivoPLTotal', total: true }
  ];

  let head = '<tr><th>Conta</th>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  let body = '';
  linhas.forEach((l, i) => {
    if (l.section) {
      body += `<tr class="section-row"><td colspan="${cols.length + 1}">${l.lbl}</td></tr>`;
      return;
    }
    let cells = '';
    for (let c = 0; c < cols.length; c++) {
      // Primeira coluna (BP inicial, antes do contrato): só caixa, capital, ativoTotal, passivoPLTotal
      if (c === 0 && !['caixa', 'capital', 'ativoTotal', 'passivoPLTotal'].includes(l.key)) {
        cells += givenCell(0);
      } else {
        cells += `<td>${inputCell(`${idPrefix}_bp_${l.key}_${c}`)}</td>`;
      }
    }
    body += `<tr class="${l.total ? 'total' : ''}"><td>${l.lbl}</td>${cells}</tr>`;
  });

  return `
    <h4>Balanço Patrimonial — cenário com arrendamento</h4>
    <p style="font-size:.88rem;color:var(--ink-soft);">Note as duas datas próximas (31/12/${v.inicio} e 1/jan/${incrAno(v.inicio, 1)}): a primeira é o BP inicial, a segunda é logo após o reconhecimento do arrendamento. Use sinais positivos — os "(−)" do título já indicam o sinal contábil.</p>
    <div class="tbl-wrap">
    <table class="acc compact"><thead>${head}</thead><tbody>${body}</tbody></table>
    </div>`;
}

function tabelaDREHTML(v, gab, idPrefix, idSuffix = 'arr') {
  const cols = gab.dre.map(d => `20${incrAno(v.inicio, d.ano)}`);
  let head = '<tr><th>Conta</th>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';

  const linhas = [
    { lbl: 'Receitas', key: 'receitas' },
    { lbl: '(−) Depreciação', key: 'depreciacao', sinal: -1 },
    { lbl: '(−) Despesas financeiras', key: 'despFin', sinal: -1 },
    { lbl: 'Lucro Líquido', key: 'lucroLiq', total: true }
  ];

  let body = '';
  linhas.forEach((l, i) => {
    let cells = '';
    for (let c = 0; c < cols.length; c++) {
      cells += `<td>${inputCell(`${idPrefix}_dre_${idSuffix}_${l.key}_${c}`)}</td>`;
    }
    body += `<tr class="${l.total ? 'total' : ''}"><td>${l.lbl}</td>${cells}</tr>`;
  });

  return `
    <h4>DRE — cenário com arrendamento</h4>
    <div class="tbl-wrap">
    <table class="acc compact"><thead>${head}</thead><tbody>${body}</tbody></table>
    </div>`;
}

function tabelaDFCHTML(v, gab, idPrefix, idSuffix = 'arr') {
  const cols = gab.dfc.map(d => `20${incrAno(v.inicio, d.ano)}`);
  let head = '<tr><th>Conta</th>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';

  const linhas = [
    { lbl: 'Fluxo das Operações', section: true },
    { lbl: 'Lucro Líquido', key: 'lucroLiq' },
    { lbl: '(+) Depreciação', key: 'depreciacao' },
    { lbl: '(+) Despesa financeira', key: 'despFin' },
    { lbl: 'Caixa gerado nas operações', key: 'caixaOper', subtotal: true },
    { lbl: 'Fluxo de Financiamento', section: true },
    { lbl: 'Pgto de juros', key: 'pgtoJuros' },
    { lbl: 'Pgto do principal', key: 'pgtoPrincipal' },
    { lbl: 'Caixa nos financiamentos', key: 'caixaFin', subtotal: true },
    { lbl: 'Variação líquida do caixa', key: 'saldo', total: true }
  ];

  let body = '';
  linhas.forEach((l) => {
    if (l.section) {
      body += `<tr class="section-row"><td colspan="${cols.length + 1}">${l.lbl}</td></tr>`;
      return;
    }
    let cells = '';
    for (let c = 0; c < cols.length; c++) {
      cells += `<td>${inputCell(`${idPrefix}_dfc_${idSuffix}_${l.key}_${c}`)}</td>`;
    }
    const cls = l.total ? 'total' : (l.subtotal ? 'subtotal' : '');
    body += `<tr class="${cls}"><td>${l.lbl}</td>${cells}</tr>`;
  });

  return `
    <h4>DFC — cenário com arrendamento (método indireto)</h4>
    <div class="tbl-wrap">
    <table class="acc compact"><thead>${head}</thead><tbody>${body}</tbody></table>
    </div>`;
}

function tabelaAluguelHTML(v, gab, idPrefix) {
  // BP, DRE, DFC simplificados do cenário aluguel
  const colsBP = gab.bpAluguel.map(b => b.data);
  const colsDRE = gab.dreAluguel.map(d => `20${incrAno(v.inicio, d.ano)}`);

  // BP aluguel
  const bpLin = [
    { lbl: 'Caixa', key: 'caixa' },
    { lbl: 'ATIVO TOTAL', key: 'ativoTotal', total: true },
    { lbl: 'Capital', key: 'capital' },
    { lbl: 'Reserva de lucros', key: 'reservas' },
    { lbl: 'PASSIVO + PL TOTAL', key: 'passivoPLTotal', total: true }
  ];
  let bpBody = '';
  bpLin.forEach(l => {
    let cells = '';
    for (let c = 0; c < colsBP.length; c++) {
      cells += `<td>${inputCell(`${idPrefix}_bpalu_${l.key}_${c}`)}</td>`;
    }
    bpBody += `<tr class="${l.total ? 'total' : ''}"><td>${l.lbl}</td>${cells}</tr>`;
  });

  // DRE aluguel
  const dreLin = [
    { lbl: 'Receitas', key: 'receitas' },
    { lbl: '(−) Despesas de aluguel', key: 'despAluguel' },
    { lbl: 'Lucro Líquido', key: 'lucroLiq', total: true }
  ];
  let dreBody = '';
  dreLin.forEach(l => {
    let cells = '';
    for (let c = 0; c < colsDRE.length; c++) {
      cells += `<td>${inputCell(`${idPrefix}_drealu_${l.key}_${c}`)}</td>`;
    }
    dreBody += `<tr class="${l.total ? 'total' : ''}"><td>${l.lbl}</td>${cells}</tr>`;
  });

  // DFC aluguel
  const dfcLin = [
    { lbl: 'Lucro Líquido', key: 'lucroLiq' },
    { lbl: 'Caixa Operacional', key: 'caixaOper' },
    { lbl: 'Variação líquida do caixa', key: 'saldo', total: true }
  ];
  let dfcBody = '';
  dfcLin.forEach(l => {
    let cells = '';
    for (let c = 0; c < colsDRE.length; c++) {
      cells += `<td>${inputCell(`${idPrefix}_dfcalu_${l.key}_${c}`)}</td>`;
    }
    dfcBody += `<tr class="${l.total ? 'total' : ''}"><td>${l.lbl}</td>${cells}</tr>`;
  });

  return `
    <h4>Cenário comparativo: Aluguel (sem reconhecimento de ativo/passivo)</h4>
    <p style="font-size:.88rem;color:var(--ink-soft);">No tratamento de aluguel operacional puro, a despesa vai direto à DRE — não há ativo nem passivo no BP, e o caixa só varia pelo saldo operacional.</p>
    <h4 style="margin-top:1rem;">BP — Aluguel</h4>
    <div class="tbl-wrap">
    <table class="acc compact"><thead><tr><th>Conta</th>${colsBP.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${bpBody}</tbody></table>
    </div>
    <h4 style="margin-top:1rem;">DRE — Aluguel</h4>
    <div class="tbl-wrap">
    <table class="acc compact"><thead><tr><th>Conta</th>${colsDRE.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${dreBody}</tbody></table>
    </div>
    <h4 style="margin-top:1rem;">DFC — Aluguel</h4>
    <div class="tbl-wrap">
    <table class="acc compact"><thead><tr><th>Conta</th>${colsDRE.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${dfcBody}</tbody></table>
    </div>`;
}

function passoAPassoHTML(v, gab) {
  const tirLabel = v.frequencia === 'mensal' ? 'mensal' : 'anual';
  const tirEquiv = v.frequencia === 'mensal' ? `(equivalente anual ≈ ${fmtPct(Math.pow(1 + gab.tir, 12) - 1, 2)})` : '';

  let extra = '';
  if (v.tipo === 'completo') {
    extra = `
      <div class="step">
        <span class="step-num">5.</span>
        <span class="step-title">DRE anual</span>
        <div class="step-body">
          <p>Para cada ano de vida útil:</p>
          <span class="formula">Receitas − Depreciação anual − Despesas financeiras = Lucro Líquido</span>
          <p>A <strong>despesa financeira</strong> de cada ano é a soma dos <em>juros mensais</em> da tabela financeira naquele ano. Em ${v.inicio.startsWith('X') ? '20' : ''}${incrAno(v.inicio, 1)}: <strong>${fmt(gab.dre[0].despFin)}</strong> | em ${v.inicio.startsWith('X') ? '20' : ''}${incrAno(v.inicio, 2)}: <strong>${fmt(gab.dre[1].despFin)}</strong>${gab.dre[2] ? ` | em ${v.inicio.startsWith('X') ? '20' : ''}${incrAno(v.inicio, 3)}: <strong>${fmt(gab.dre[2].despFin)}</strong>` : ''}.</p>
          <p>Lucros líquidos: ${gab.dre.map(d => fmt(d.lucroLiq)).join(' → ')}.</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">6.</span>
        <span class="step-title">Balanço Patrimonial — pulo do gato</span>
        <div class="step-body">
          <p>O passivo é registrado pelo <strong>valor bruto</strong> dos pagamentos a fazer e os <strong>juros a transcorrer</strong> aparecem como conta retificadora (− no passivo). Isso significa:</p>
          <span class="formula">Passivo líquido = Σ Pgtos futuros − Σ Juros futuros = Saldo da dívida</span>
          <p>Separar entre <strong>CP</strong> (pagamentos do próximo exercício) e <strong>LP</strong> (demais).</p>
          <p>Caixa de cada ano = Caixa anterior + Receitas do ano − Pagamentos do ano. Reserva de lucros acumula o lucro líquido. <strong>Sempre confira:</strong> Ativo total deve igualar Passivo + PL total.</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">7.</span>
        <span class="step-title">DFC — método indireto</span>
        <div class="step-body">
          <p>Parte-se do lucro líquido e adicionam-se as <strong>despesas que não afetaram caixa</strong> (depreciação) e as <strong>despesas financeiras</strong> (que serão pagas no fluxo de financiamento, evitando dupla contagem):</p>
          <span class="formula">Caixa operacional = Lucro Líquido + Depreciação + Despesa Financeira</span>
          <p>No fluxo de financiamento, <strong>separe</strong>: pagamento de juros + pagamento de principal. A soma destes dois é exatamente o pagamento total do ano (negativo).</p>
          <p>A variação líquida do caixa deve bater com a variação efetiva da conta caixa no BP.</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">8.</span>
        <span class="step-title">Cenário aluguel — porque essa comparação importa</span>
        <div class="step-body">
          <p>No aluguel operacional <em>puro</em>, não há reconhecimento de ativo nem de passivo. A despesa de aluguel vai direto à DRE pelo valor pago no período. Lucros líquidos do aluguel: <strong>${gab.dreAluguel.map(d => fmt(d.lucroLiq)).join(' → ')}</strong>.</p>
          <p><strong>Insight contábil:</strong> No <em>longo prazo</em>, o lucro acumulado é o mesmo nos dois cenários (a riqueza econômica não muda). Mas o <em>perfil temporal</em> muda: no arrendamento, o lucro fica mais "alto" no início (depreciação linear é menor que pagamentos antecipados de aluguel) e a empresa mostra mais ativos e mais dívida.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="steps" id="steps-${v.id}">
      <h3>Resolução passo a passo</h3>

      <div class="step">
        <span class="step-num">1.</span>
        <span class="step-title">Identificar a taxa de desconto (TIR)</span>
        <div class="step-body">
          <p>O contrato troca <strong>${fmt(v.valor)}</strong> hoje por uma série de <strong>${v.n}</strong> pagamentos de <strong>${fmt(v.pgto)}</strong> + um residual final de <strong>${fmt(v.residual)}</strong>. A taxa implícita resolve:</p>
          <span class="formula">${fmt(v.valor)} = Σ Pgto_t / (1+i)^t  →  i ≈ <strong>${fmtPct(gab.tir, 4)}</strong> ${tirLabel} ${tirEquiv}</span>
          <p>Na prova você usaria uma calculadora financeira (<em>HP12C: f REG, ${fmt(-v.valor)} CHS g CFo, ...</em>) ou Excel (<code>=TIR(...)</code>).</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">2.</span>
        <span class="step-title">Montar a tabela financeira (amortização)</span>
        <div class="step-body">
          <p>Em cada período, calcule nesta ordem:</p>
          <span class="formula">Juros_t = Saldo_{t-1} × i  |  Amort_t = Pgto_t − Juros_t  |  Saldo_t = Saldo_{t-1} − Amort_t</span>
          <p>Comece com Saldo_0 = ${fmt(v.valor)}. No último período, soma o residual ao pagamento. O saldo final tem que zerar.</p>
        </div>
      </div>

      <div class="step">
        <span class="step-num">3.</span>
        <span class="step-title">Reconhecimento inicial — lançamento</span>
        <div class="step-body">
          <p>Quando assume o contrato (1/jan/${incrAno(v.inicio, 1)}):</p>
          <span class="formula">D — Máquinas/Edifícios (ativo) ${fmt(v.valor)}<br>D — Juros a transcorrer (retificadora do passivo) ${fmt(v.pgto * v.n + v.residual - v.valor)}<br>C — Arrendamento a pagar (CP+LP, bruto) ${fmt(v.pgto * v.n + v.residual)}</span>
        </div>
      </div>

      <div class="step">
        <span class="step-num">4.</span>
        <span class="step-title">Depreciação linear</span>
        <div class="step-body">
          <p>Vida útil de <strong>${v.vidaUtil} anos</strong> sem valor residual:</p>
          <span class="formula">Depreciação anual = ${fmt(v.valor)} ÷ ${v.vidaUtil} = <strong>${fmt(gab.depreciacaoAnual)}</strong></span>
          <p>Lançamento anual: D — Despesa de depreciação | C — Depreciação acumulada.</p>
        </div>
      </div>

      ${extra}
    </div>
  `;
}

function mostrarExercicio(id) {
  const v = variacoes.find(x => x.id === id);
  const gab = calcularGabarito(v);
  const idPrefix = `v${v.id}`;
  const wrap = document.getElementById('exercises-container');

  let conteudo = `
    <div class="ex-wrap active" id="ex-${v.id}">
      <div class="ex-header">
        <div class="ex-sub">Variação ${v.id} · ${v.cenario}</div>
        <div class="ex-title">${v.titulo}</div>
      </div>

      <div class="panel statement">
        <h4>Enunciado</h4>
        <p>${v.enunciado}</p>

        <div class="given-data">
          <h4>Dados</h4>
          <ul>
            <li><span>Valor do bem (à vista)</span><strong>R$ ${fmt(v.valor)}</strong></li>
            <li><span>Pagamentos ${v.frequencia === 'mensal' ? 'mensais' : 'anuais'}</span><strong>${v.n} × R$ ${fmt(v.pgto)}</strong></li>
            <li><span>Valor residual (na última parcela)</span><strong>R$ ${fmt(v.residual)}</strong></li>
            <li><span>Vida útil</span><strong>${v.vidaUtil} anos</strong></li>
            ${v.bpInicial ? `<li><span>BP inicial</span><strong>Caixa ${fmt(v.bpInicial.caixa)} · PL ${fmt(v.bpInicial.capital)}</strong></li>` : ''}
            ${v.receitaPorPeriodo ? `<li><span>Receita ${v.frequencia === 'mensal' ? 'mensal' : 'anual'}</span><strong>R$ ${fmt(v.receitaPorPeriodo)}</strong></li>` : ''}
          </ul>
        </div>
      </div>

      <div class="panel">
        <h3>Tabelas para preencher</h3>

        <h4>Taxa de desconto (TIR)</h4>
        <p style="font-size:.88rem;color:var(--ink-soft);">Calcule a taxa de juros implícita do contrato e digite abaixo (em decimal — ex.: 0,015844 ou 1,5844 para %).</p>
        <p>Taxa ${v.frequencia}: <input class="cell" type="text" inputmode="decimal" data-id="${idPrefix}_tir" data-dec="6" style="max-width:140px;display:inline-block;" /></p>

        ${tabelaFinanceiraHTML(v, gab, idPrefix)}

        <div class="sub-tabs" id="subtabs-${v.id}">
            <button class="active" data-sub="arr">Cenário Arrendamento</button>
            <button data-sub="alu">Cenário Aluguel</button>
          </div>
          <div class="sub-tab-content active" data-sub="arr">
            ${tabelaBPHTML(v, gab, idPrefix)}
            ${tabelaDREHTML(v, gab, idPrefix)}
            ${tabelaDFCHTML(v, gab, idPrefix)}
          </div>
          <div class="sub-tab-content" data-sub="alu">
            ${tabelaAluguelHTML(v, gab, idPrefix)}
          </div>
      </div>

      <div class="btn-row">
        <button class="btn primary" onclick="verificar(${v.id})">✓ Verificar respostas</button>
        <button class="btn gold" onclick="mostrarGabarito(${v.id})">Mostrar gabarito</button>
        <button class="btn" onclick="togglePasso(${v.id})">Passo a passo</button>
        <button class="btn ghost" onclick="limpar(${v.id})">Limpar</button>
        <span class="score-badge" id="score-${v.id}"><span class="dot"></span><span class="lbl">Aguardando verificação</span></span>
      </div>

      ${passoAPassoHTML(v, gab)}
    </div>
  `;

  wrap.innerHTML = conteudo;

  // Salvar gabarito no DOM (data attribute) para verificação posterior
  window.gabaritos = window.gabaritos || {};
  window.gabaritos[v.id] = { v, gab };

  // Sub-tabs
  const subtabs = document.getElementById(`subtabs-${v.id}`);
  if (subtabs) {
    subtabs.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        subtabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        document.querySelectorAll(`[data-sub]`).forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const target = b.dataset.sub;
        document.querySelectorAll(`#ex-${v.id} .sub-tab-content`).forEach(x => {
          x.classList.toggle('active', x.dataset.sub === target);
        });
      });
    });
  }
}

// ============================================================
//  VERIFICAÇÃO
// ============================================================
function getRespostas(id) {
  // Constrói mapa { inputId -> valorEsperado }
  const { v, gab } = window.gabaritos[id];
  const idPrefix = `v${v.id}`;
  const map = {};

  // TIR
  map[`${idPrefix}_tir`] = gab.tir; // será comparada como decimal OU percentual

  // Tabela financeira
  for (let i = 1; i <= v.n; i++) {
    map[`${idPrefix}_fluxo_${i}`] = round(gab.tabela[i].fluxo);
    map[`${idPrefix}_juros_${i}`] = round(gab.tabela[i].juros);
    map[`${idPrefix}_amort_${i}`] = round(gab.tabela[i].amort);
    if (i < v.n) map[`${idPrefix}_saldo_${i}`] = round(gab.tabela[i].divida);
  }

  // BP
    gab.bp.forEach((b, c) => {
      ['caixa', 'maquinas', 'depAcum', 'arrCP', 'jurosCP', 'arrLP', 'jurosLP', 'capital', 'reservas', 'ativoTotal', 'passivoPLTotal'].forEach(k => {
        const id = `${idPrefix}_bp_${k}_${c}`;
        // Para a primeira coluna (BP inicial), só caixa, capital, ativoTotal, passivoPLTotal são "esperados", outros são 0 dados
        map[id] = b[k] || 0;
      });
    });
    // DRE
    gab.dre.forEach((d, c) => {
      ['receitas', 'depreciacao', 'despFin', 'lucroLiq'].forEach(k => {
        map[`${idPrefix}_dre_arr_${k}_${c}`] = d[k];
      });
    });
    // DFC
    gab.dfc.forEach((d, c) => {
      ['lucroLiq', 'depreciacao', 'despFin', 'caixaOper', 'pgtoJuros', 'pgtoPrincipal', 'caixaFin', 'saldo'].forEach(k => {
        map[`${idPrefix}_dfc_arr_${k}_${c}`] = d[k];
      });
    });
    // Aluguel
    gab.bpAluguel.forEach((b, c) => {
      ['caixa', 'capital', 'reservas', 'ativoTotal', 'passivoPLTotal'].forEach(k => {
        map[`${idPrefix}_bpalu_${k}_${c}`] = b[k] || 0;
      });
    });
    gab.dreAluguel.forEach((d, c) => {
      ['receitas', 'despAluguel', 'lucroLiq'].forEach(k => {
        map[`${idPrefix}_drealu_${k}_${c}`] = d[k];
      });
    });
    gab.dfcAluguel.forEach((d, c) => {
      ['lucroLiq', 'caixaOper', 'saldo'].forEach(k => {
        map[`${idPrefix}_dfcalu_${k}_${c}`] = d[k];
      });
    });

  return map;
}

function parseUserNum(str) {
  if (!str) return NaN;
  // Remove espaços, troca vírgula por ponto, remove pontos de milhar
  let s = String(str).trim().replace(/\s/g, '').replace(/%/g, '');
  // Se contém vírgula como decimal: troca pontos por nada, vírgula por ponto
  if (s.indexOf(',') >= 0) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // só pontos: se houver mais de um, são milhares; se um e tem 1-2 dígitos depois, é decimal
    const partes = s.split('.');
    if (partes.length > 2) {
      // múltiplos pontos = milhares
      s = s.replace(/\./g, '');
    } else if (partes.length === 2 && partes[1].length === 3) {
      // 1.000 = milhares
      s = s.replace(/\./g, '');
    }
  }
  return parseFloat(s);
}

function compararValores(esperado, dado, isTIR = false) {
  if (isNaN(dado)) return false;
  // Para TIR: aceitar tanto 0.0158 quanto 1.5844 (dois formatos)
  if (isTIR) {
    const esp = esperado;
    const tol = Math.max(esp * 0.005, 0.00005); // 0,5% de tolerância relativa
    if (Math.abs(dado - esp) <= tol) return true;
    if (Math.abs(dado / 100 - esp) <= tol) return true;
    return false;
  }
  // Tolerância: ±2 (arredondamento) ou 1% relativo, o que for maior
  const tol = Math.max(2, Math.abs(esperado) * 0.005);
  return Math.abs(dado - esperado) <= tol;
}

function verificar(id) {
  const map = getRespostas(id);
  const ex = document.getElementById(`ex-${id}`);
  let acertos = 0, total = 0;
  ex.querySelectorAll('input.cell:not(.given)').forEach(inp => {
    if (inp.readOnly) return;
    const idAttr = inp.dataset.id;
    if (!(idAttr in map)) return;
    total++;
    const dado = parseUserNum(inp.value);
    const esp = map[idAttr];
    const isTIR = idAttr.endsWith('_tir');
    if (inp.value.trim() === '') {
      inp.classList.remove('correct', 'incorrect');
      return;
    }
    if (compararValores(esp, dado, isTIR)) {
      inp.classList.add('correct'); inp.classList.remove('incorrect');
      acertos++;
    } else {
      inp.classList.add('incorrect'); inp.classList.remove('correct');
    }
  });
  // Score
  const scoreEl = document.getElementById(`score-${id}`);
  scoreEl.classList.remove('good', 'bad');
  if (total === 0) {
    scoreEl.querySelector('.lbl').textContent = 'Nada preenchido ainda';
  } else {
    const pct = Math.round((acertos / total) * 100);
    scoreEl.querySelector('.lbl').textContent = `${acertos}/${total} preenchidos corretos (${pct}%)`;
    scoreEl.classList.add(pct >= 80 ? 'good' : 'bad');
  }
  // Scroll suave para o primeiro errado
  const primeiroErro = ex.querySelector('input.cell.incorrect');
  if (primeiroErro && primeiroErro.scrollIntoView) primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarGabarito(id) {
  const map = getRespostas(id);
  const ex = document.getElementById(`ex-${id}`);
  ex.querySelectorAll('input.cell').forEach(inp => {
    if (inp.readOnly) return;
    const idAttr = inp.dataset.id;
    if (!(idAttr in map)) return;
    const esp = map[idAttr];
    const isTIR = idAttr.endsWith('_tir');
    if (isTIR) {
      inp.value = (esp * 100).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + '%';
    } else {
      inp.value = fmt(esp);
    }
    inp.classList.add('correct'); inp.classList.remove('incorrect');
  });
}

function limpar(id) {
  const ex = document.getElementById(`ex-${id}`);
  ex.querySelectorAll('input.cell').forEach(inp => {
    if (inp.readOnly) return;
    inp.value = '';
    inp.classList.remove('correct', 'incorrect');
  });
  const scoreEl = document.getElementById(`score-${id}`);
  scoreEl.classList.remove('good', 'bad');
  scoreEl.querySelector('.lbl').textContent = 'Aguardando verificação';
}

function togglePasso(id) {
  const el = document.getElementById(`steps-${id}`);
  el.classList.toggle('show');
  if (el.classList.contains('show')) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
//  QUIZ DOS CPCs
// ============================================================
const cpcs = [
  { code: '06 (R2)', label: 'Arrendamentos', short: 'CPC 06', emoji: '🏗️' },
  { code: '46', label: 'Mensuração do Valor Justo', short: 'CPC 46', emoji: '⚖️' },
  { code: '28', label: 'Propriedade para Investimento', short: 'CPC 28', emoji: '🏢' },
  { code: '47', label: 'Receita de Contrato com Cliente', short: 'CPC 47', emoji: '📋' },
  { code: '01 (R1)', label: 'Redução ao Valor Recuperável', short: 'CPC 01', emoji: '📉' }
];

const perguntas = [
  // ============================================================
  //  CPC 01 (R1) - REDUÇÃO AO VALOR RECUPERÁVEL
  //  As "filhas da pu" clássicas: limite da reversão, goodwill irreversível,
  //  vida útil indefinida, UGC com alocação.
  // ============================================================
  {
    cpc: '01 (R1)',
    pergunta: 'A empresa <b>Intermediária S.A.</b> possui em 31/12/X1 um ativo intangível de <b>vida útil indefinida</b> no valor contábil de <b>R$ 130.000</b>, composto por: custo R$ 150.000 e perda por desvalorização reconhecida em X1 de R$ 20.000. Em 31/12/X2, o teste de impairment indicou: valor líquido de uso R$ 120.000; valor líquido de venda R$ 160.000. Como a empresa deve proceder em 31/12/X2 caso esse intangível seja <b>marcas e patentes</b>?',
    opcoes: [
      'Reconhecer nova perda de R$ 10.000 (130.000 − 120.000), pois deve usar o valor em uso por ser mais conservador.',
      'Reverter a perda em R$ 20.000 e levar ao resultado, restabelecendo o valor contábil para R$ 150.000.',
      'Aumentar o ativo em R$ 30.000 (160.000 − 130.000), reconhecendo um ganho no resultado.',
      'Não fazer nada — basta divulgar em nota explicativa que o valor recuperável é superior.'
    ],
    correta: 1,
    explicacao: 'Valor recuperável = MAIOR entre VLV e VLU = max(160.000; 120.000) = <b>R$ 160.000</b>. Como 160.000 > 130.000 (valor contábil), há indício de reversão da perda anterior. PORÉM, a reversão é <b>limitada ao valor que existiria caso a perda nunca tivesse sido reconhecida</b>. Como o ativo tem vida útil indefinida, NÃO sofre depreciação — o teto é o próprio custo original (R$ 150.000). Logo, reverte exatamente os R$ 20.000 da perda original, levando ao resultado (CPC 01.R1, item 117).'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'No mesmo cenário (Intermediária S.A., VC R$ 130.000, VLU R$ 120.000, VLV R$ 160.000 em 31/12/X2), como proceder caso o ativo seja <b>ágio derivado de expectativa de rentabilidade futura</b> (goodwill)?',
    opcoes: [
      'Reverter a perda em R$ 20.000 e levar ao resultado.',
      'Reverter a perda em R$ 20.000 contra reserva de lucros (não passa pela DRE).',
      'Manter o valor contábil em R$ 130.000 — perdas reconhecidas em ágio (goodwill) <b>não podem ser revertidas</b>.',
      'Reclassificar como intangível com vida útil definida e reverter pela diferença.'
    ],
    correta: 2,
    explicacao: 'O CPC 01 (R1), item 124, é categórico: <b>"A perda por desvalorização do ágio por expectativa de rentabilidade futura não pode ser revertida em períodos subsequentes"</b>. É a famosa exceção: todos os outros ativos podem ter perdas revertidas (com limite), MENOS o goodwill. Esse é o ponto que a professora costuma cobrar — o tratamento muda completamente quando o ativo é goodwill.'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Empresa Y possui máquina (CPC 27) com saldo contábil de <b>R$ 800.000</b> em 31/12/X3 (custo R$ 1.000.000 − dep. acum. R$ 200.000). O teste de impairment apurou: valor líquido de venda R$ 600.000; valor em uso R$ 720.000; vida útil restante 4 anos. Qual o tratamento contábil?',
    opcoes: [
      'Reconhecer perda de R$ 200.000 (1.000.000 − 800.000) — diferença entre custo e VC.',
      'Reconhecer perda de R$ 80.000 (800.000 − 720.000), pois o valor recuperável é R$ 720.000.',
      'Reconhecer perda de R$ 200.000 usando o VLV (mais conservador).',
      'Não há perda — o valor de venda (600.000) é menor que o VC, então deve manter pelo VC.'
    ],
    correta: 1,
    explicacao: 'Valor recuperável = MAIOR entre VLV e VLU = max(600.000; 720.000) = <b>R$ 720.000</b>. Como 720.000 < 800.000 (valor contábil), há perda de <b>R$ 80.000</b>. Pegadinha clássica: muita gente usa o VLV achando que é mais conservador — errado, a regra do CPC 01 é o MAIOR dos dois (o ativo "vale" o melhor uso possível, não o pior).'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Uma UGC tem ativos com os seguintes valores contábeis: Goodwill R$ 100.000; Imobilizado R$ 200.000; Intangível com vida útil definida R$ 100.000 (total R$ 400.000). O valor recuperável da UGC é R$ 280.000. Como alocar a perda de R$ 120.000?',
    opcoes: [
      'R$ 40.000 a cada elemento (parte igual entre os três).',
      'R$ 60.000 ao Imobilizado, R$ 30.000 ao Goodwill, R$ 30.000 ao Intangível (proporcional ao VC).',
      'Reduz primeiro o Goodwill em R$ 100.000 (zerando-o); os R$ 20.000 restantes são alocados pro rata aos demais ativos pelo VC: ~R$ 13.333 ao Imobilizado e ~R$ 6.667 ao Intangível.',
      'Aloca tudo (R$ 120.000) ao Goodwill primeiro; como passa do saldo, registra R$ 100.000 e dispensa o restante.'
    ],
    correta: 2,
    explicacao: 'CPC 01.R1, item 104: a perda da UGC é alocada (1) <b>primeiro ao goodwill</b> alocado àquela UGC; (2) o restante, <b>pro rata aos demais ativos da UGC</b> com base nos respectivos valores contábeis. Limite: nenhum ativo individual pode cair abaixo do MAIOR entre seu VLV, valor em uso (se mensurável) e zero. A perda residual nunca é "dispensada" — sempre absorvida.'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Para o cálculo do valor em uso de uma UGC, o CPC 01 manda EXCLUIR alguns fluxos de caixa. Qual abaixo está CORRETAMENTE excluído?',
    opcoes: [
      'Custos diretos de produção projetados.',
      'Receitas previstas com base em contratos vigentes.',
      'Pagamentos de juros sobre financiamentos e tributos sobre o lucro; também fluxos de melhorias futuras ainda não comprometidas.',
      'Custos de manutenção rotineira do ativo.'
    ],
    correta: 2,
    explicacao: 'O valor em uso reflete o ativo "como ele está hoje". Por isso EXCLUI: (i) fluxos de financiamento (juros, principal); (ii) tributos sobre o lucro; (iii) reestruturações futuras ainda não comprometidas; (iv) melhorias e expansões futuras. Os fluxos devem ser PRÉ-IMPOSTOS e a taxa de desconto também é PRÉ-IMPOSTOS. Manutenção rotineira ENTRA (mantém o ativo no estado atual).'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Sobre a frequência do teste de impairment, o CPC 01 (R1) determina:',
    opcoes: [
      'Anualmente para todos os ativos imobilizados e intangíveis.',
      'Apenas quando houver indícios de desvalorização — não há teste obrigatório anual.',
      'Anualmente (e sempre que houver indícios) para: <b>goodwill</b>, <b>intangíveis com vida útil indefinida</b> e <b>intangíveis ainda não disponíveis para uso</b>. Para os demais, apenas quando houver indícios.',
      'Trimestralmente para todos os ativos.'
    ],
    correta: 2,
    explicacao: 'Item 10 do CPC 01 (R1). Para a maioria dos ativos, basta haver indícios. Mas três categorias têm teste OBRIGATÓRIO ANUAL independente de indícios: (1) ágio (goodwill); (2) intangíveis com vida útil indefinida; (3) intangíveis ainda não disponíveis para uso (em desenvolvimento). Razão: estes não são depreciados/amortizados, então sem o teste anual a perda passaria despercebida.'
  },

  // ============================================================
  //  CPC 06 (R2) - ARRENDAMENTOS
  // ============================================================
  {
    cpc: '06 (R2)',
    pergunta: 'Em 1/1/X1 a Cia Beta firma contrato de arrendamento de equipamento por <b>4 anos</b>, com <b>4 pagamentos anuais de R$ 50.000 ao final de cada ano</b>. Não há valor residual nem opção de compra. Taxa implícita do contrato: <b>10% a.a.</b>. Qual o passivo de arrendamento na data inicial?',
    opcoes: [
      'R$ 200.000 — soma nominal das prestações.',
      'R$ 158.493 — valor presente das 4 prestações anuais a 10%.',
      'R$ 150.000 — pagamento médio descontado.',
      'R$ 220.000 — soma das prestações + 10%.'
    ],
    correta: 1,
    explicacao: 'O passivo é mensurado pelo VP das contraprestações futuras à taxa implícita. VP = 50.000 × [1 − (1,10)⁻⁴] / 0,10 = 50.000 × 3,16987 ≈ <b>R$ 158.493</b>. Soma nominal nunca é resposta correta no CPC 06 (R2) — o passivo é sempre descontado a valor presente.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'A Cia Gamma arrenda um equipamento por <b>5 anos</b> sem opção de compra que se espera exercer e sem transferência de propriedade ao final. <b>Vida útil técnica</b> do equipamento = 8 anos. O direito de uso reconhecido foi de <b>R$ 200.000</b>. Qual o valor da depreciação anual?',
    opcoes: [
      'R$ 25.000 (200.000 ÷ 8) — pela vida útil técnica.',
      'R$ 40.000 (200.000 ÷ 5) — pelo prazo do arrendamento.',
      'R$ 30.769 — média ponderada entre prazo e vida útil.',
      'Zero — o ativo será devolvido ao arrendador, então não deprecia.'
    ],
    correta: 1,
    explicacao: 'CPC 06 (R2), item 32: quando NÃO há transferência de propriedade ao fim do contrato (e não há opção de compra que se espera exercer), o ativo de direito de uso é depreciado pelo <b>menor entre o prazo do arrendamento e a vida útil técnica</b>. Aqui: min(5; 8) = 5 anos. Logo, R$ 200.000 ÷ 5 = <b>R$ 40.000/ano</b>. A lógica: o arrendatário só extrai benefícios durante o prazo.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'A Cia Delta arrenda um veículo por <b>4 anos</b> com opção de compra ao final por R$ 5.000 (valor justo esperado do veículo nessa data: R$ 25.000). A administração concluiu que é <b>altamente provável exercer a opção</b>. Vida útil técnica = 8 anos. Como tratar a depreciação?',
    opcoes: [
      'Depreciar em 4 anos (prazo do contrato).',
      'Depreciar pelo menor entre prazo e vida útil técnica = 4 anos.',
      'Depreciar em 8 anos (vida útil técnica), pois há expectativa de transferência efetiva.',
      'Não depreciar até o exercício da opção.'
    ],
    correta: 2,
    explicacao: 'Quando há <b>expectativa de transferência</b> da propriedade (opção de compra altamente provável de exercer, ou cláusula de transferência), deprecia-se pela vida útil técnica COMPLETA (8 anos), porque o arrendatário ficará com o ativo depois do contrato. Sutileza: o que muda a lógica é a EXPECTATIVA documentada, não o valor de mercado da opção em si.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'Qual elemento abaixo NÃO compõe o custo inicial do <b>ativo de direito de uso</b> no CPC 06 (R2)?',
    opcoes: [
      'O passivo de arrendamento mensurado a valor presente.',
      'Pagamentos efetuados antes da data de início (antecipados).',
      'Custos diretos iniciais incorridos pelo arrendatário.',
      'Os juros que se acumularão sobre o passivo durante todo o prazo do contrato.'
    ],
    correta: 3,
    explicacao: 'O custo inicial do RoU = passivo inicial + pagamentos antecipados + custos diretos iniciais − incentivos recebidos + estimativa de custos de desmontagem/restauração. Os <b>juros futuros</b> NÃO entram — eles serão reconhecidos como despesa financeira ao longo do contrato (custo amortizado do passivo). Confundir os dois é erro clássico.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'Em 1/1/X3, durante um arrendamento de 5 anos já em curso, as partes acordam <b>estender o prazo</b> por mais 3 anos com revisão dos pagamentos. A modificação não é tratada como contrato separado. Como contabilizar?',
    opcoes: [
      'Continuar com os mesmos parâmetros — alteração de prazo não afeta valores contábeis.',
      'Reconhecer um novo arrendamento separado, mantendo o anterior intacto.',
      'Remensurar o passivo de arrendamento usando uma <b>taxa de desconto atualizada</b> e ajustar o ativo de direito de uso pelo MESMO valor da remensuração.',
      'Reconhecer a diferença diretamente no resultado do período, sem ajustar BP.'
    ],
    correta: 2,
    explicacao: 'CPC 06 (R2), itens 44–46. Modificação que NÃO é tratada como contrato separado: (1) remensura o passivo descontando os pagamentos revisados a uma <b>taxa atualizada</b> na data da modificação; (2) o valor do ajuste é registrado como <b>contrapartida no ativo de direito de uso</b> (mesma magnitude). Não passa por DRE no momento — só pela amortização/juros futuros.'
  },

  // ============================================================
  //  CPC 28 - PROPRIEDADE PARA INVESTIMENTO
  // ============================================================
  {
    cpc: '28',
    pergunta: 'A Construtora Z mensura suas PPIs pelo <b>modelo do valor justo</b>. Em 1/1/X3, um imóvel registrado como PPI (valor contábil R$ 750.000, valor justo na data R$ 800.000) deixa de ser locado e passa a ser ocupado pela administração para uso próprio. Como tratar?',
    opcoes: [
      'Reclassificar para Imobilizado pelo valor contábil de R$ 750.000, sem reconhecer ganho.',
      'Reclassificar para Imobilizado pelo <b>valor justo na data</b> (R$ 800.000), reconhecendo o ganho de R$ 50.000 <b>no resultado</b>.',
      'Reclassificar para Imobilizado por R$ 800.000, com a diferença de R$ 50.000 em ORA.',
      'Manter como PPI até o fim do exercício.'
    ],
    correta: 1,
    explicacao: 'CPC 28, item 60. Na transferência de PPI a valor justo → Imobilizado, o <b>valor justo na data da mudança de uso vira o "custo" do imobilizado</b>. Antes da reclassificação, ainda se atualiza o VJ (a diferença vai à DRE como variação de VJ de PPI, normalmente). É a lógica oposta da transferência IMOB→PPI no modelo de VJ, que pode passar por ORA via reavaliação (CPC 27).'
  },
  {
    cpc: '28',
    pergunta: 'A Cia Lambda inicia em janeiro de X1 a <b>construção de um edifício</b> que será destinado a aluguel a terceiros após a conclusão. Como classificar o ativo durante a fase de construção?',
    opcoes: [
      'Como Imobilizado em curso, transferindo para PPI apenas na conclusão.',
      'Como Estoque em produção até o início da locação.',
      'Como <b>Propriedade para Investimento em construção</b> desde o início, aplicando as regras do CPC 28.',
      'Como Despesa antecipada até a primeira receita de aluguel.'
    ],
    correta: 2,
    explicacao: 'A revisão R1 do CPC 28 (alinhada à IAS 40) esclareceu este ponto: imóvel em construção destinado a uso futuro como PPI é classificado como <b>PPI desde o início</b>. Aplica-se o modelo escolhido (custo ou VJ — se possível mensurar com confiabilidade durante a obra). Erro clássico: tratar como imobilizado em construção e reclassificar só ao concluir.'
  },
  {
    cpc: '28',
    pergunta: 'A Imobiliária Sigma possui um conjunto de imóveis classificados como <b>Estoque</b> (loja imobiliária — imóveis para venda no curso normal). Em 1/1/X3, decide retirar 5 unidades do giro de venda e colocá-las para alugar. Como tratar a reclassificação?',
    opcoes: [
      'Manter como Estoque até a venda eventual — locação não muda a classificação.',
      'Transferir para <b>PPI</b> a partir do início da locação (mudança de uso evidenciada pelo início do contrato).',
      'Reclassificar como Imobilizado.',
      'Reconhecer como ativo intangível.'
    ],
    correta: 1,
    explicacao: 'CPC 28, item 57: a transferência DE Estoque PARA PPI ocorre quando há evidência de mudança de uso — tipicamente o início da operação de locação. No modelo de VJ, qualquer diferença entre o VC do estoque e o VJ na data vai ao resultado (semelhante a uma venda). Critério-chave do CPC 28: <b>intenção</b> da empresa.'
  },
  {
    cpc: '28',
    pergunta: 'Sobre a escolha entre os modelos de mensuração subsequente da PPI (custo ou valor justo), qual afirmação está CORRETA conforme o CPC 28?',
    opcoes: [
      'A escolha pode ser feita imóvel por imóvel — cada PPI pode ter um modelo diferente.',
      'A escolha é uma política contábil aplicada a <b>todas</b> as suas propriedades para investimento, e a mudança do custo para o VJ é permitida; mas a mudança do VJ para o custo é considerada altamente improvável de resultar em apresentação mais adequada.',
      'O modelo do VJ é obrigatório para empresas de capital aberto.',
      'No modelo do VJ, a empresa também depreciará o imóvel ao longo da vida útil.'
    ],
    correta: 1,
    explicacao: 'CPC 28, itens 30 e 31. (1) A escolha é GLOBAL, aplicada a TODAS as PPIs; não há cherry-picking. (2) Mudança do custo → VJ é permitida; mudança VJ → custo é altamente improvável de resultar em apresentação mais adequada. (3) <b>No modelo do VJ NÃO há depreciação</b> — todas as variações vão direto à DRE. Confundir "VJ + depreciação" é erro recorrente (essa lógica é do CPC 27, não do 28).'
  },

  // ============================================================
  //  CPC 46 - VALOR JUSTO
  // ============================================================
  {
    cpc: '46',
    pergunta: 'A Cia Ômega pode vender um ativo em três mercados (a empresa tem acesso a todos; <b>nenhum</b> é considerado mercado principal). Os preços e custos são: <b>Mercado A</b> — preço 100, custo de transação 5, transporte 3 (líquido 92). <b>Mercado B</b> — preço 105, custo de transação 6, transporte 4 (líquido 95). <b>Mercado C</b> — preço 110, custo de transação 12, transporte 5 (líquido 93). Qual o valor justo do ativo?',
    opcoes: [
      'R$ 110 — maior preço bruto disponível (Mercado C).',
      'R$ 95 — valor líquido do mercado mais vantajoso após todos os custos (Mercado B).',
      'R$ 101 — preço do mercado mais vantajoso (B), ajustado apenas pelo custo de transporte.',
      'R$ 105 — preço do mercado mais vantajoso (B), sem qualquer ajuste.'
    ],
    correta: 2,
    explicacao: 'Duas etapas, e é aqui que muita gente erra. <b>(1) Identificar o mercado mais vantajoso</b>: comparar valores LÍQUIDOS (após todos os custos). A=92, B=95, C=93 → Mercado B. <b>(2) Calcular o valor justo no mercado escolhido</b>: o VJ é o preço, ajustado APENAS por custos de transporte (porque transporte é característica do ativo — sua localização). <b>Custos de transação NÃO ajustam o valor justo</b> (apenas servem para escolher o mercado). Logo: 105 − 4 (transporte) = <b>R$ 101</b>.'
  },
  {
    cpc: '46',
    pergunta: 'A Empresa Fênix possui um terreno usado como estacionamento (uso atual). Estudo de mercado mostra que o uso de "<b>maior e melhor uso</b>" para participantes do mercado seria edificação residencial, que valorizaria o terreno em 40% em relação ao uso atual. A edificação é fisicamente possível, legalmente permitida e financeiramente viável. Como mensurar o valor justo do terreno?',
    opcoes: [
      'Pelo valor do uso atual (estacionamento) — é o uso efetivo da entidade.',
      'Pelo valor do uso de maior e melhor uso (residencial), pois a premissa do CPC 46 é a perspectiva de participantes do mercado.',
      'Pela média dos dois usos.',
      'Pelo valor de uso que minimiza tributação.'
    ],
    correta: 1,
    explicacao: 'CPC 46, item 27 e seguintes. Para ativos não financeiros, o valor justo considera o <b>"highest and best use"</b> — o uso que maximizaria o valor para participantes do mercado, mesmo que diferente do uso atual da entidade, desde que: (i) fisicamente possível, (ii) legalmente permitido, (iii) financeiramente viável. Lógica: o VJ é uma medida de mercado, não uma medida de valor para o atual proprietário.'
  },
  {
    cpc: '46',
    pergunta: 'A empresa mensura ações a valor justo. As ações são negociadas em bolsa ativa, com preço de fechamento de R$ 25,00. A empresa possui 100.000 ações, e essa quantidade representaria 15% do volume diário negociado. Como classificar e mensurar?',
    opcoes: [
      'Nível 1; valor justo = 100.000 × R$ 25 = R$ 2.500.000.',
      'Nível 2; aplicar desconto por iliquidez devido ao volume relevante.',
      'Nível 3; usar modelo interno proprietário.',
      'Nível 1 ajustado; aplicar prêmio de controle.'
    ],
    correta: 0,
    explicacao: 'Nível 1 = preço cotado <b>não ajustado</b> em mercado ativo para o ativo idêntico. CPC 46 é explícito: para ações em bolsa ativa, o valor justo é simplesmente quantidade × preço de fechamento, <b>sem descontos por bloco grande, prêmios de controle ou ajustes por liquidez</b> (item 80). Esse é um dos pontos mais cobrados — a tentação de "ajustar o preço de tela" sempre cai em prova.'
  },

  // ============================================================
  //  CPC 47 - RECEITA DE CONTRATO COM CLIENTE
  // ============================================================
  {
    cpc: '47',
    pergunta: 'A Cia Atlas vende um equipamento industrial por R$ 100.000 com instalação obrigatória inclusa (a instalação é altamente especializada e o equipamento <b>não funciona sem ela</b>; a empresa é a única no mercado capaz de instalá-lo). Quantas obrigações de performance distintas há nesse contrato?',
    opcoes: [
      'Duas — equipamento e instalação são bens/serviços distintos.',
      'Três — equipamento, instalação e garantia implícita.',
      '<b>Uma única</b> obrigação de performance — equipamento e instalação são altamente integrados; nesse contexto, NÃO são separadamente identificáveis.',
      'Depende do prazo de instalação.'
    ],
    correta: 2,
    explicacao: 'CPC 47, itens 27–30. Os DOIS critérios para "distinta": (i) capaz de ser distinto isoladamente (cliente se beneficia sozinho ou com recursos disponíveis) E (ii) <b>distinto NO CONTEXTO do contrato</b> (separadamente identificável). Aqui o critério (ii) FALHA: o equipamento sem a instalação especializada não é útil, há alta dependência funcional. Logo, vira <b>uma única obrigação combinada</b>. Reconhecer como duas seria erro grave de quem só lê o critério (i).'
  },
  {
    cpc: '47',
    pergunta: 'A Cia Hércules firma contrato fixo de R$ 1.000.000 para construção de uma obra, com bônus adicional de R$ 200.000 caso entregue em até 12 meses. O histórico da empresa mostra entrega no prazo em <b>cerca de 60% dos casos similares</b>. Como tratar o bônus na alocação do preço da transação?',
    opcoes: [
      'Reconhecer R$ 1.200.000 (preço base + bônus) — a expectativa é positiva.',
      'Reconhecer R$ 1.120.000 (1.000 + 60% × 200) usando o método do valor esperado, sem mais nada.',
      'Estimar o bônus pelo valor esperado ou mais provável, MAS aplicar a <b>"restrição" (constraint)</b>: incluir apenas na medida em que seja "altamente provável" que não haverá reversão significativa. 60% provavelmente NÃO atinge esse limiar — incluir somente os R$ 1.000.000.',
      'Reconhecer R$ 1.000.000 e contabilizar o bônus apenas no recebimento.'
    ],
    correta: 2,
    explicacao: 'CPC 47, itens 56–58. A contraprestação variável é estimada (valor esperado OU mais provável, conforme o que prever melhor), mas <b>só é incluída no preço da transação enquanto for "altamente provável" não haver reversão significativa</b>. 60% dificilmente caracteriza "altamente provável". A receita do bônus fica retida ATÉ a probabilidade subir (ou a obra concluir). Diferença sutil entre estimar e reconhecer — ponto recorrente em prova.'
  },
  {
    cpc: '47',
    pergunta: 'Em 1/1/X1 a Cia Vênus vende uma máquina por R$ 1.210.000 a receber em <b>2/1/X3</b> (24 meses depois) sem juros explícitos. Taxa de mercado para esse risco: 10% a.a. Como reconhecer?',
    opcoes: [
      'Receita de venda de R$ 1.210.000 em X1.',
      'Receita de venda de R$ 1.210.000 em X3 (no recebimento).',
      'Receita de venda de <b>R$ 1.000.000 em X1</b> (VP descontado a 10%) + receita financeira de R$ 100.000 em X1 e R$ 110.000 em X2.',
      'Diferimento total da receita em conta de passivo até o recebimento.'
    ],
    correta: 2,
    explicacao: 'CPC 47, itens 60–65: quando o contrato tem <b>componente significativo de financiamento</b> (>12 meses, em geral), separa-se o VP (receita de venda) dos juros implícitos (receita financeira ao longo dos períodos). VP = 1.210.000 ÷ (1,10)² = <b>R$ 1.000.000</b>. Juros X1 = 1.000.000 × 10% = R$ 100.000. Juros X2 = 1.100.000 × 10% = R$ 110.000. Total recebido = 1.210.000 ✓.'
  },
  {
    cpc: '47',
    pergunta: 'A Cia Mercurio vende um pacote por R$ 100.000 contendo: <b>Produto A</b> (preço de venda avulso R$ 60.000), <b>Produto B</b> (avulso R$ 50.000) e <b>Serviço C</b> (avulso R$ 30.000). Os três são obrigações de performance distintas. Como alocar a receita do pacote?',
    opcoes: [
      'R$ 33.333 para cada (parte igual entre os três).',
      'A=R$ 60.000; B=R$ 50.000; C=R$ 30.000 (preço avulso individual, totalizando R$ 140.000).',
      'A=R$ 42.857; B=R$ 35.714; C=R$ 21.429 (alocação pro rata pelos preços avulsos: 60/140 × 100, 50/140 × 100, 30/140 × 100).',
      'Tudo ao Produto A, por ser o item principal do pacote.'
    ],
    correta: 2,
    explicacao: 'CPC 47, item 74. O preço da transação (R$ 100.000) é alocado às obrigações de performance <b>proporcionalmente aos preços de venda avulsos</b> ("standalone selling prices"). Soma dos avulsos = 140.000. Cada um recebe sua fatia proporcional do preço pago. O desconto de R$ 40.000 (140 − 100) é distribuído pro rata. NÃO se aloca pelo preço cheio (somaria 140 ≠ 100) nem em parte igual (não reflete valor relativo).'
  },
  {
    cpc: '47',
    pergunta: 'Qual situação NÃO permite reconhecer a receita "<b>ao longo do tempo</b>" segundo o CPC 47?',
    opcoes: [
      'O cliente recebe e consome simultaneamente os benefícios à medida que a entidade realiza (ex.: serviços de limpeza recorrentes).',
      'A entidade cria/melhora um ativo que o cliente controla à medida que é criado (ex.: construção em terreno do cliente).',
      'A entidade cria um ativo sem uso alternativo E tem direito exigível ao pagamento pelo desempenho realizado até a data.',
      'A entidade fabrica produto padrão para estoque, com pagamento parcelado em 24 vezes.'
    ],
    correta: 3,
    explicacao: 'CPC 47, item 35: receita "ao longo do tempo" exige UM dos três critérios listados (A, B ou C aqui). A alternativa D não atende nenhum: (i) cliente NÃO consome simultaneamente (vai para estoque), (ii) entidade NÃO cria ativo controlado pelo cliente, (iii) é produto PADRÃO (com uso alternativo — pode ser vendido a qualquer outro cliente). Logo, receita reconhecida em UM MOMENTO (entrega/transferência de controle). Pagamento parcelado é irrelevante para esse julgamento.'
  }
];

function renderQuiz() {
  const picker = document.getElementById('cpc-picker');
  picker.innerHTML = `
    <div class="cpc-chip active" data-cpc="todos">
      <div class="num-big">★</div>
      <div class="lbl">Todos</div>
      <div class="ttl">Misto (todos os CPCs)</div>
    </div>
    ${cpcs.map(c => `
      <div class="cpc-chip" data-cpc="${c.code}">
        <div class="num-big">${c.code}</div>
        <div class="lbl">${c.short}</div>
        <div class="ttl">${c.label}</div>
      </div>
    `).join('')}
  `;
  picker.querySelectorAll('.cpc-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      picker.querySelectorAll('.cpc-chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      mostrarPerguntas(chip.dataset.cpc);
    });
  });
  mostrarPerguntas('todos');
}

function mostrarPerguntas(cpcFiltro) {
  const cont = document.getElementById('quiz-container');
  let lista = cpcFiltro === 'todos' ? perguntas : perguntas.filter(p => p.cpc === cpcFiltro);
  // Embaralha levemente para não cansar
  lista = lista.slice();

  cont.innerHTML = lista.map((p, idx) => `
    <div class="quiz-q" data-q="${idx}">
      <div class="q-cpc">CPC ${p.cpc}</div>
      <div><span class="q-num">${idx + 1}.</span><span class="q-text">${p.pergunta}</span></div>
      <div class="options">
        ${p.opcoes.map((o, i) => `
          <button class="opt" data-opt="${i}">
            <span class="letter">${String.fromCharCode(65 + i)}.</span>
            <span>${o}</span>
          </button>
        `).join('')}
      </div>
      <div class="explanation"><strong>Por quê:</strong> ${p.explicacao}</div>
    </div>
  `).join('');

  cont.querySelectorAll('.quiz-q').forEach((qEl, idx) => {
    const p = lista[idx];
    qEl.querySelectorAll('.opt').forEach((opt, i) => {
      opt.addEventListener('click', () => {
        if (qEl.classList.contains('answered')) return;
        qEl.classList.add('answered');
        qEl.querySelectorAll('.opt').forEach(o => o.classList.add('locked'));
        if (i === p.correta) {
          opt.classList.add('correct');
        } else {
          opt.classList.add('incorrect');
          // marca a correta também
          qEl.querySelectorAll('.opt')[p.correta].classList.add('correct');
        }
        qEl.querySelector('.explanation').classList.add('show');
      });
    });
  });
}

// ============================================================
//  TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('tab-' + b.dataset.tab).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderPicker();
  mostrarExercicio(1);
  renderQuiz();
});
