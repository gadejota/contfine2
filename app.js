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
  // ----- VAR 1: estilo Exercício 1 da foto (RESIDE) -----
  {
    id: 1,
    nivel: 'iniciante',
    tipo: 'simples',          // só tabela financeira + depreciação
    titulo: 'Cia RESIDE — Edifício',
    cenario: 'Estilo Exercício 1 · pagamentos anuais',
    enunciado: 'A <strong>Cia RESIDE</strong>, em <strong>31/12/X0</strong>, realiza um contrato de arrendamento para aquisição de um Edifício com pagamento de <strong>3 parcelas anuais de R$ 20.000</strong> e <strong>valor residual de R$ 3.000</strong> a pagar com a última parcela. O valor à vista do Edifício é de <strong>R$ 50.000</strong>, e a vida útil é de <strong>4 anos</strong>, sem valor residual. Identifique a taxa de desconto, preencha a tabela financeira e a de depreciação, e contabilize o arrendamento e a depreciação em cada data.',
    valor: 50000, pgto: 20000, n: 3, residual: 3000,
    frequencia: 'anual',
    vidaUtil: 4,
    inicio: 'X0'
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
  return `<input class="cell given" type="text" value="${fmt(value, dec)}" readonly />`;
}

function tabelaFinanceiraHTML(v, gab, idPrefix) {
  // Mostra mês a mês (ou ano a ano)
  const isMensal = v.frequencia === 'mensal';
  const total = v.n;
  // Para 24-36 linhas, fica grande mas é o que professora pede.
  // Linha 0 (saldo inicial) damos como dado.
  let rows = `
    <tr>
      <td>${isMensal ? '0 (início)' : `31/12/${v.inicio}`}</td>
      ${givenCell(0)}
      ${givenCell(v.valor)}
      ${givenCell(0)}
      ${givenCell(0)}
      ${givenCell(v.valor)}
    </tr>`;
  for (let i = 1; i <= total; i++) {
    const periodo = isMensal ? `mês ${i}` : `31/12/${incrAno(v.inicio, i)}`;
    rows += `
      <tr>
        <td>${periodo}</td>
        <td>${inputCell(`${idPrefix}_fluxo_${i}`)}</td>
        <td>${inputCell(`${idPrefix}_div_${i}`)}</td>
        <td>${inputCell(`${idPrefix}_juros_${i}`)}</td>
        <td>${inputCell(`${idPrefix}_amort_${i}`)}</td>
        ${i === total ? givenCell(0) : `<td>${inputCell(`${idPrefix}_saldo_${i}`)}</td>`}
      </tr>`;
  }
  return `
    <h4>Tabela financeira (amortização do passivo)</h4>
    <p style="font-size:.88rem;color:var(--ink-soft);">Preencha mês a mês: <em>Pagamento</em>, <em>Saldo da dívida ao final</em>, <em>Juros</em> e <em>Amortização do principal</em>. Saldo inicial e saldo final (=0) já vêm preenchidos.</p>
    <div class="tbl-wrap">
    <table class="acc compact">
      <thead><tr><th>Período</th><th>Pagamento</th><th>Saldo dívida</th><th>Juros</th><th>Amortização</th><th>Saldo após</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

function tabelaDepreciacaoHTML(v, gab, idPrefix) {
  let rows = '';
  for (let a = 0; a <= v.vidaUtil; a++) {
    const dataLabel = `31/12/${incrAno(v.inicio, a)}`;
    if (a === 0) {
      rows += `<tr>
        <td>${dataLabel}</td>
        ${givenCell(v.valor)}
        ${givenCell(0)}
        ${givenCell(v.valor)}
      </tr>`;
    } else {
      rows += `<tr>
        <td>${dataLabel}</td>
        <td>${inputCell(`${idPrefix}_dep_vrbem_${a}`)}</td>
        <td>${inputCell(`${idPrefix}_dep_acum_${a}`)}</td>
        <td>${inputCell(`${idPrefix}_dep_vc_${a}`)}</td>
      </tr>`;
    }
  }
  return `
    <h4>Tabela de depreciação do bem</h4>
    <p style="font-size:.88rem;color:var(--ink-soft);">Depreciação linear pela vida útil. <em>Vr. do bem</em> permanece constante; <em>depreciação acumulada</em> aumenta a cada ano.</p>
    <div class="tbl-wrap">
    <table class="acc compact">
      <thead><tr><th>Data</th><th>Vr. do bem</th><th>Depreciação acum.</th><th>Vr. contábil</th></tr></thead>
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

        ${v.tipo === 'simples' ? tabelaDepreciacaoHTML(v, gab, idPrefix) : ''}

        ${v.tipo === 'completo' ? `
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
        ` : ''}
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
    map[`${idPrefix}_div_${i}`] = round(gab.tabela[i - 1].divida); // saldo dívida no início do período (= saldo após anterior)
    map[`${idPrefix}_juros_${i}`] = round(gab.tabela[i].juros);
    map[`${idPrefix}_amort_${i}`] = round(gab.tabela[i].amort);
    if (i < v.n) map[`${idPrefix}_saldo_${i}`] = round(gab.tabela[i].divida);
  }

  // Depreciação (apenas tipo simples)
  if (v.tipo === 'simples') {
    for (let a = 1; a <= v.vidaUtil; a++) {
      map[`${idPrefix}_dep_vrbem_${a}`] = v.valor;
      map[`${idPrefix}_dep_acum_${a}`] = round(gab.depTabela[a].depAcum);
      map[`${idPrefix}_dep_vc_${a}`] = round(gab.depTabela[a].vrContabil);
    }
  }

  if (v.tipo === 'completo') {
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
  }

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
  if (primeiroErro) primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  // ---------- CPC 06 (R2) - ARRENDAMENTOS ----------
  {
    cpc: '06 (R2)',
    pergunta: 'Segundo o CPC 06 (R2), na data de início do arrendamento, o arrendatário deve mensurar o passivo de arrendamento por:',
    opcoes: [
      'A soma nominal das contraprestações futuras a pagar.',
      'O valor presente dos pagamentos do arrendamento ainda não efetuados, descontados pela taxa implícita ou, se essa não for prontamente determinável, pela taxa incremental do arrendatário.',
      'O valor de mercado do ativo subjacente.',
      'O valor justo na data, mais custos diretos.'
    ],
    correta: 1,
    explicacao: 'O passivo é mensurado pelo VP das contraprestações ainda não pagas. A taxa preferida é a implícita do contrato; só se não for facilmente determinável usa-se a taxa incremental do arrendatário.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'Quais elementos integram o custo inicial do ativo de direito de uso?',
    opcoes: [
      'Apenas o valor presente dos pagamentos.',
      'Apenas o valor justo do ativo subjacente.',
      'Passivo inicial + pagamentos antecipados + custos diretos iniciais − incentivos recebidos + estimativa de custos de desmontagem/restauração.',
      'Passivo inicial × (1 + taxa de desconto).'
    ],
    correta: 2,
    explicacao: 'O direito de uso parte do passivo de arrendamento e ajusta por: (+) pagamentos antecipados, (+) custos diretos iniciais, (−) incentivos recebidos do arrendador, (+) estimativa de custos de desmontagem e restauração.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'Em quais situações o arrendatário PODE optar por não reconhecer ativo de direito de uso e passivo (registrando despesa linear)?',
    opcoes: [
      'Apenas quando o contrato for cancelável a qualquer momento.',
      'Em arrendamentos de curto prazo (até 12 meses sem opção de compra) e arrendamentos cujo ativo subjacente é de baixo valor quando novo.',
      'Em qualquer arrendamento operacional, a critério do arrendatário.',
      'Apenas quando o arrendador também não reconhecer.'
    ],
    correta: 1,
    explicacao: 'O CPC 06 (R2) prevê duas isenções OPCIONAIS: (i) curto prazo — até 12 meses sem opção de compra que se espera exercer; e (ii) ativo de baixo valor quando novo (referência informal de US$ 5.000).'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'A depreciação do ativo de direito de uso, quando NÃO há transferência de propriedade no fim do contrato e nem opção de compra que se espera exercer, é feita:',
    opcoes: [
      'Pela vida útil do ativo subjacente.',
      'Pelo prazo do arrendamento.',
      'Pela menor entre a vida útil do ativo subjacente e o prazo do arrendamento.',
      'Não há depreciação — o ativo é mensurado a valor justo.'
    ],
    correta: 2,
    explicacao: 'Quando NÃO há transferência de propriedade ao fim, deprecia-se pela menor entre vida útil e prazo do contrato — porque o arrendatário só extrai benefícios durante o prazo. Se HOUVER transferência, deprecia-se pela vida útil completa.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'Após o reconhecimento inicial, o passivo de arrendamento é mensurado pelo:',
    opcoes: [
      'Valor justo, com variações reconhecidas em outros resultados abrangentes.',
      'Valor justo, com variações reconhecidas no resultado.',
      'Custo amortizado: aumenta pelos juros (sobre o saldo, à taxa de desconto) e diminui pelos pagamentos efetuados.',
      'Valor nominal das parcelas restantes.'
    ],
    correta: 2,
    explicacao: 'Mensuração subsequente do passivo segue o método do custo amortizado: Saldo_t = Saldo_{t-1} + Juros − Pagamento. Os juros entram no resultado como despesa financeira.'
  },
  {
    cpc: '06 (R2)',
    pergunta: 'Em qual demonstração contábil o pagamento de PRINCIPAL do arrendamento aparece no arrendatário (DFC)?',
    opcoes: [
      'Atividades operacionais.',
      'Atividades de investimento.',
      'Atividades de financiamento.',
      'Não aparece — o pagamento total vai como despesa operacional.'
    ],
    correta: 2,
    explicacao: 'O CPC 06 (R2) define que o pagamento do PRINCIPAL do passivo vai sempre nas atividades de financiamento. A parcela de juros pode ir em operacional ou financiamento (a escolha deve ser consistente).'
  },

  // ---------- CPC 46 - VALOR JUSTO ----------
  {
    cpc: '46',
    pergunta: 'Qual a definição de valor justo no CPC 46?',
    opcoes: [
      'Preço de aquisição do ativo deduzido da depreciação acumulada.',
      'Preço que seria recebido pela venda de um ativo ou pago pela transferência de um passivo em uma transação não forçada entre participantes do mercado na data da mensuração.',
      'Preço médio de cotação do ativo no mercado mais ativo nos últimos 30 dias.',
      'Custo de reposição do ativo a novo.'
    ],
    correta: 1,
    explicacao: 'Valor justo é o preço de saída (exit price) numa transação ordenada entre participantes do mercado, na data da mensuração. Não é preço forçado nem custo histórico.'
  },
  {
    cpc: '46',
    pergunta: 'O CPC 46 estabelece uma hierarquia de inputs para mensuração do valor justo. Quais são os níveis em ordem decrescente de prioridade?',
    opcoes: [
      'Nível 1 (preços observáveis em mercado ativo de ativos idênticos) → Nível 2 (inputs observáveis para ativos similares) → Nível 3 (inputs não observáveis).',
      'Nível 1 (custo histórico) → Nível 2 (custo corrente) → Nível 3 (valor presente).',
      'Nível 1 (interno) → Nível 2 (auditado) → Nível 3 (regulatório).',
      'Nível 1 (subjetivo) → Nível 2 (consenso) → Nível 3 (mercado).'
    ],
    correta: 0,
    explicacao: 'Hierarquia: Nível 1 = preço cotado (não ajustado) em mercado ativo para o ativo idêntico — input mais confiável; Nível 2 = inputs observáveis (não preços diretos); Nível 3 = inputs não observáveis (modelos internos).'
  },
  {
    cpc: '46',
    pergunta: 'Para um ativo NÃO financeiro, o conceito de "maior e melhor uso" significa que:',
    opcoes: [
      'O valor justo é sempre o do uso atual do proprietário.',
      'O valor justo considera o uso que maximizaria seu valor por participantes do mercado, mesmo que diferente do uso atual.',
      'O ativo deve ser mensurado pelo seu valor de liquidação imediata.',
      'O ativo deve ser registrado pelo maior valor entre custo e mercado.'
    ],
    correta: 1,
    explicacao: 'Para ativos não financeiros, o valor justo reflete o "highest and best use" — o uso fisicamente possível, legalmente permitido e financeiramente viável que maximiza o valor para participantes do mercado, mesmo que difira do uso atual da entidade.'
  },
  {
    cpc: '46',
    pergunta: 'Mercado principal vs. mercado mais vantajoso: como o CPC 46 define a referência para mensuração?',
    opcoes: [
      'Sempre o mercado mais vantajoso (que fornece o maior preço líquido).',
      'O mercado principal (o de maior volume e atividade para o ativo) tem prioridade. Apenas se não houver mercado principal, usa-se o mais vantajoso.',
      'Um mercado escolhido pela administração com base na materialidade.',
      'O mercado físico em que o ativo está localizado, sempre.'
    ],
    correta: 1,
    explicacao: 'A regra é: mercado principal primeiro (o de maior volume e atividade ao qual a entidade tem acesso). Só se não houver mercado principal usa-se o mais vantajoso (aquele que maximiza valor recebido líquido de custos de transação e transporte).'
  },
  {
    cpc: '46',
    pergunta: 'Os custos de transação devem ser:',
    opcoes: [
      'Adicionados ao valor justo na mensuração.',
      'Considerados na escolha do mercado mais vantajoso, mas NÃO ajustam o valor justo medido.',
      'Sempre debitados como despesa antecipada.',
      'Ignorados em todas as situações.'
    ],
    correta: 1,
    explicacao: 'Custos de transação são levados em conta na DETERMINAÇÃO do mercado mais vantajoso (para comparar líquidos), mas o valor justo em si NÃO é ajustado por esses custos — eles são uma característica da transação, não do ativo.'
  },

  // ---------- CPC 28 - PROPRIEDADE PARA INVESTIMENTO ----------
  {
    cpc: '28',
    pergunta: 'Qual a definição de Propriedade para Investimento (PPI) segundo o CPC 28?',
    opcoes: [
      'Qualquer imóvel registrado pela empresa.',
      'Imóvel mantido pelo proprietário (ou arrendatário em arrendamento financeiro) para auferir aluguel, valorização do capital, ou ambos — e não para uso na produção/administração nem venda no curso normal das operações.',
      'Imóvel destinado exclusivamente à venda futura.',
      'Imóvel utilizado pela administração da empresa.'
    ],
    correta: 1,
    explicacao: 'PPI é distinta do Imobilizado (uso próprio) e dos Estoques (venda no curso normal). O critério é a INTENÇÃO: gerar aluguel ou valorização.'
  },
  {
    cpc: '28',
    pergunta: 'Quais os modelos de mensuração subsequente permitidos para PPI?',
    opcoes: [
      'Apenas custo histórico.',
      'Apenas valor justo.',
      'Modelo do custo OU modelo do valor justo, escolhido como política contábil aplicada a TODAS as PPIs.',
      'Custo histórico até 5 anos, depois valor justo obrigatoriamente.'
    ],
    correta: 2,
    explicacao: 'A entidade escolhe entre o modelo de custo (custo − depreciação − perda) ou o modelo de valor justo. A escolha é política contábil e deve ser aplicada a TODAS as suas PPIs.'
  },
  {
    cpc: '28',
    pergunta: 'No modelo do valor justo do CPC 28, as variações de valor justo da PPI são reconhecidas:',
    opcoes: [
      'Em Outros Resultados Abrangentes (ORA) e levadas a reserva no PL.',
      'No resultado do exercício (DRE).',
      'Diretamente no PL como ajuste de avaliação patrimonial.',
      'Capitalizadas no próprio ativo, sem afetar resultado.'
    ],
    correta: 1,
    explicacao: 'Diferentemente da reavaliação do imobilizado (CPC 27), no modelo de valor justo do CPC 28 as variações vão direto à DRE. Não há depreciação para PPI mensurada a valor justo.'
  },
  {
    cpc: '28',
    pergunta: 'Quando uma propriedade deixa de ser usada pelo proprietário e passa a ser locada (transferência de Imobilizado para PPI), no modelo de valor justo do CPC 28, a diferença entre valor contábil e valor justo na data da transferência é tratada como:',
    opcoes: [
      'Lucro ou prejuízo direto na DRE.',
      'Tratada como uma reavaliação segundo o CPC 27 — o aumento, em geral, vai a ORA (até o limite de perdas anteriores em DRE).',
      'Goodwill negativo.',
      'Receita diferida.'
    ],
    correta: 1,
    explicacao: 'Na transferência IMOB→PPI, qualquer diferença para valor justo é tratada como uma reavaliação (CPC 27): aumento via ORA (exceto se reverter perda anterior, daí DRE); decréscimo direto a DRE (exceto se houver saldo de reserva, daí ORA).'
  },
  {
    cpc: '28',
    pergunta: 'Imóvel construído pela empresa para alugar a terceiros. Qual a classificação durante a construção e após a conclusão?',
    opcoes: [
      'Sempre Imobilizado.',
      'Sempre Estoque (até a primeira locação).',
      'Durante a construção: ativo em construção (imobilizado/intangível, conforme regras gerais). Após a conclusão e início da intenção de locar: PPI.',
      'Sempre PPI desde o início da construção.'
    ],
    correta: 2,
    explicacao: 'A revisão R1 do CPC 28 esclarece: durante a construção destinada a uso futuro como PPI, o ativo já é classificado como PPI em construção. A partir da intenção de gerar aluguel/valorização e na medida em que possa ser mensurado de forma confiável a valor justo, aplicam-se as regras de PPI.'
  },

  // ---------- CPC 47 - RECEITA ----------
  {
    cpc: '47',
    pergunta: 'Quais são as 5 etapas do modelo de reconhecimento de receita do CPC 47?',
    opcoes: [
      '(1) Identificar o contrato; (2) Identificar as obrigações de performance; (3) Determinar o preço da transação; (4) Alocar o preço às obrigações; (5) Reconhecer a receita ao satisfazer cada obrigação.',
      '(1) Provisionar; (2) Realizar; (3) Faturar; (4) Receber; (5) Lançar.',
      '(1) Custo; (2) Margem; (3) Preço; (4) Venda; (5) Recebimento.',
      '(1) Pedido; (2) Entrega; (3) Aceite; (4) Nota fiscal; (5) Pagamento.'
    ],
    correta: 0,
    explicacao: 'O modelo dos 5 steps é o coração do CPC 47: contrato → obrigações de performance → preço → alocação → reconhecimento. Receita é reconhecida quando (ou à medida que) cada obrigação de performance é satisfeita.'
  },
  {
    cpc: '47',
    pergunta: 'O que é uma obrigação de performance "distinta" segundo o CPC 47?',
    opcoes: [
      'Qualquer item listado separadamente na nota fiscal.',
      'Bem ou serviço (ou conjunto) que (i) o cliente pode se beneficiar isoladamente ou em combinação com recursos prontamente disponíveis E (ii) é separadamente identificável dos demais no contrato.',
      'Um item com valor contratual superior a 10% do total.',
      'Um produto que tenha código de barras próprio.'
    ],
    correta: 1,
    explicacao: 'Os dois critérios para "distinta" são: (i) capaz de ser distinto (cliente se beneficia sozinho) E (ii) distinto NO CONTEXTO do contrato (separadamente identificável). Se ambos atendidos, é obrigação de performance distinta e deve ser tratada como unidade de contabilização separada.'
  },
  {
    cpc: '47',
    pergunta: 'Quando a receita deve ser reconhecida AO LONGO DO TEMPO em vez de em um momento específico?',
    opcoes: [
      'Sempre que o cliente fizer pagamentos parcelados.',
      'Quando atender a pelo menos UM destes: (i) o cliente recebe e consome simultaneamente os benefícios; (ii) a entidade cria/melhora ativo controlado pelo cliente; (iii) a entidade não cria ativo com uso alternativo E tem direito exigível ao pagamento pelo desempenho até a data.',
      'Apenas quando o contrato durar mais de 1 ano.',
      'Apenas para serviços, nunca para vendas de produtos.'
    ],
    correta: 1,
    explicacao: 'O reconhecimento ao longo do tempo exige UM dos três critérios. Se nenhum for atendido, a receita é reconhecida em determinado MOMENTO (geralmente a transferência do controle).'
  },
  {
    cpc: '47',
    pergunta: 'No preço da transação que envolve contraprestação variável (descontos, bonificações, performance), o CPC 47 manda:',
    opcoes: [
      'Reconhecer pelo valor máximo possível.',
      'Estimar pelo valor esperado (média ponderada de probabilidades) ou valor mais provável, e reconhecer apenas na medida em que seja altamente provável que NÃO ocorrerá uma reversão significativa de receita acumulada (constraint).',
      'Reconhecer apenas após a totalidade do recebimento.',
      'Adiar todo o reconhecimento até o fim do contrato.'
    ],
    correta: 1,
    explicacao: 'A entidade estima a contraprestação variável pelo método mais previsível (valor esperado ou valor mais provável) e aplica a "restrição" (constraint): reconhecer só o que se acredita altamente provável não reverter. Reavaliar a cada data de balanço.'
  },
  {
    cpc: '47',
    pergunta: 'Em contratos com componente significativo de financiamento (pagamento muito antes ou depois da entrega), o CPC 47 exige:',
    opcoes: [
      'Ignorar o componente financeiro.',
      'Ajustar o preço da transação para refletir o efeito do valor do dinheiro no tempo, separando uma parcela como receita financeira (juros).',
      'Reconhecer a receita pelo valor pago, sempre.',
      'Diferir a receita até o pagamento.'
    ],
    correta: 1,
    explicacao: 'Se o pagamento é significativamente antecipado ou postergado em relação à entrega (geralmente >12 meses), separa-se o valor presente (receita de venda/serviço) dos juros implícitos (receita financeira). Há isenção prática para até 12 meses.'
  },

  // ---------- CPC 01 - REDUÇÃO AO VALOR RECUPERÁVEL ----------
  {
    cpc: '01 (R1)',
    pergunta: 'Como o CPC 01 (R1) define o "valor recuperável" de um ativo?',
    opcoes: [
      'Apenas o valor justo do ativo no mercado.',
      'O maior entre o valor justo líquido de despesas de venda e o valor em uso.',
      'O menor entre o valor contábil e o valor de mercado.',
      'A média entre o custo histórico e o valor de mercado.'
    ],
    correta: 1,
    explicacao: 'Valor recuperável = MAIOR entre (i) valor justo líquido de despesas de venda e (ii) valor em uso (VP dos fluxos de caixa futuros esperados). Compara-se com o valor contábil; se valor contábil > recuperável, registra-se perda.'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Quais são exemplos de INDÍCIOS EXTERNOS de redução ao valor recuperável?',
    opcoes: [
      'Apenas a deterioração física do ativo.',
      'Declínio significativo no valor de mercado do ativo, mudanças adversas no ambiente tecnológico, econômico ou legal, aumentos nas taxas de juros que afetem a taxa de desconto, valor contábil dos ativos líquidos da entidade > sua capitalização de mercado.',
      'Apenas mudanças nas políticas internas da empresa.',
      'Apenas o atraso no pagamento de fornecedores.'
    ],
    correta: 1,
    explicacao: 'O CPC 01 lista indícios externos (mercado, ambiente regulatório/tecnológico/econômico, taxas de juros, capitalização de mercado vs. valor contábil) e internos (obsolescência, danos físicos, planos de descontinuidade, desempenho econômico inferior ao previsto).'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'O que é uma Unidade Geradora de Caixa (UGC) no CPC 01?',
    opcoes: [
      'Uma filial geograficamente isolada da empresa.',
      'O menor grupo identificável de ativos que gera entradas de caixa que são em grande parte INDEPENDENTES das entradas de caixa de outros ativos ou grupos de ativos.',
      'O conjunto de todos os ativos da empresa.',
      'Um centro de custo definido pela administração.'
    ],
    correta: 1,
    explicacao: 'UGC é o menor grupo de ativos que gera fluxos de caixa independentes. Quando não é possível estimar o valor recuperável de um ativo individual, identifica-se a UGC à qual pertence e testa-se a impairment no nível da UGC.'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Sobre a REVERSÃO de perda por redução ao valor recuperável:',
    opcoes: [
      'Nunca é permitida.',
      'Sempre é permitida sem limites.',
      'É permitida quando há indícios de que a perda diminuiu, limitada ao valor contábil que existiria (líquido de depreciação) caso a perda nunca tivesse sido reconhecida — EXCETO para goodwill, cuja perda é IRREVERSÍVEL.',
      'Apenas para ativos financeiros.'
    ],
    correta: 2,
    explicacao: 'Reversão é permitida quando o cenário muda, MAS limitada ao valor contábil "como se a perda não tivesse ocorrido" (não pode levar a entidade a um valor superior). Goodwill é exceção: uma vez baixado, NUNCA reverte.'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'Para o cálculo do "valor em uso", quais elementos NÃO devem ser considerados nas projeções de fluxo de caixa?',
    opcoes: [
      'Fluxos relacionados a financiamento e tributos sobre o lucro; e fluxos decorrentes de reestruturação futura ainda não comprometida ou de melhorias futuras de desempenho.',
      'Fluxos operacionais do ativo.',
      'Receitas previstas de vendas.',
      'Custos de manutenção rotineira.'
    ],
    correta: 0,
    explicacao: 'Valor em uso usa fluxos PRÉ-IMPOSTOS e considera o ativo no estado atual. EXCLUI: fluxos de financiamento (juros), tributos sobre o lucro, reestruturações ainda não comprometidas, e melhorias/expansões futuras (porque o teste é sobre o ativo como ele está hoje).'
  },
  {
    cpc: '01 (R1)',
    pergunta: 'A perda por redução ao valor recuperável de uma UGC é alocada aos ativos da UGC seguindo qual ordem?',
    opcoes: [
      'Igualmente entre todos os ativos.',
      'Primeiro reduz o goodwill atribuído à UGC; em seguida, aos demais ativos da UGC proporcionalmente ao valor contábil — sem reduzir nenhum ativo abaixo do maior entre seu valor justo líquido, valor em uso e zero.',
      'Apenas aos ativos com maior valor contábil.',
      'Apenas aos ativos intangíveis.'
    ],
    correta: 1,
    explicacao: 'Ordem: (1) baixa primeiro o goodwill da UGC; (2) o restante é distribuído pro rata aos demais ativos. Limite: nenhum ativo individual pode cair abaixo do MAIOR entre seu valor justo líquido, valor em uso (se mensurável) e zero.'
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
