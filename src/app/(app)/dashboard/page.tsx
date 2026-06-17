'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { CardClinica } from '@/components/dashboard/CardClinica';
import { MiniCalDash } from '@/components/dashboard/MiniCalDash';
import { AgendaHoje } from '@/components/dashboard/AgendaHoje';

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('Bom dia');
  const [today, setToday] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }

    // Format data em pt-BR (ex: "terça-feira, 16 de junho de 2026")
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setToday(formatter.format(date));
  }, []);

  return (
    <div>
      {/* Saudação + Data */}
      <div className="mb-6">
        <h1
          className="heading text-2xl mb-1"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-cormorant)',
          }}
        >
          {greeting}
        </h1>
        <p className="text-text-secondary text-sm">
          {today && today.charAt(0).toUpperCase() + today.slice(1)} · Forma & Função
        </p>
      </div>

      {/* Grid 3 Colunas — desktop 1280px+ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA A — KPIs 2x2 + Card Clínica */}
        <div className="flex flex-col gap-6">
          {/* Row 1 — 2 KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Consultas Hoje"
              value="8"
              sub="3 confirmadas"
              trend="+2 vs ontem"
              trendUp
              color="accent"
            />
            <KpiCard
              title="Faturamento do Mês"
              value="R$ 48.700"
              sub="Meta: R$ 60.000"
              trend="+12% vs jun/25"
              trendUp
              color="success"
            />
          </div>

          {/* Row 2 — 2 KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Orçamentos Pendentes"
              value="14"
              sub="R$ 32.450 em aberto"
              trend="5 vencendo"
              trendUp={false}
              color="warning"
            />
            <KpiCard
              title="Pacientes Ativos"
              value="347"
              sub="28 novos este mês"
              trend="+8% vs mai/26"
              trendUp
              color="info"
            />
          </div>

          {/* Card Clínica */}
          <CardClinica
            nome="Dr. João Silva"
            especialidade="Dentística"
            cro="12345/SP"
            cidade="Balneário Camboriú, SC"
          />
        </div>

        {/* COLUNA B — Gráfico + Pacientes Recentes */}
        <div className="flex flex-col gap-6">
          <div className="card p-5">
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Faturamento
            </h2>
            <RevenueChart />
          </div>

          <RecentPatients />
        </div>

        {/* COLUNA C — Calendário + Agenda */}
        <div className="flex flex-col gap-6">
          <MiniCalDash />
          <AgendaHoje eventos={[]} dataHoje={today} />
        </div>
      </div>
    </div>
  );
}
