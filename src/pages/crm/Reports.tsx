const [sectorFilter, setSectorFilter] = React.useState<string>("all");
  const [personaFilter, setPersonaFilter] = React.useState<string>("all");
  const [lifecycleFilter, setLifecycleFilter] = React.useState<string>("all");

  const filteredProjects = React.useMemo(() => {
    return projects.filter(p => {
      const client = clientsMap[p.client_id || ''];
      const matchesSector = sectorFilter === "all" || client?.sector === sectorFilter;
      const matchesPersona = personaFilter === "all" || client?.persona === personaFilter;
      const matchesLifecycle = lifecycleFilter === "all" || client?.lifecycle_stage === lifecycleFilter;
      return matchesSector && matchesPersona && matchesLifecycle;
    });
  }, [projects, sectorFilter, personaFilter, lifecycleFilter, clientsMap]);

  const conversionRate = React.useMemo(() => {
    const totalLeads = clients.filter(c => c.lifecycle_stage === 'Lead').length;
    const activeClients = clients.filter(c => c.lifecycle_stage === 'Ativo').length;
    return totalLeads > 0 ? ((activeClients / totalLeads) * 100).toFixed(1) : '0';
  }, [clients]);

  const followUpFrequency = React.useMemo(() => {
    const totalFollowUps = projects.reduce((sum, p) => sum + (p.follow_ups?.length || 0), 0);
    const totalProjects = projects.length;
    return totalProjects > 0 ? (totalFollowUps / totalProjects).toFixed(1) : '0';
  }, [projects]);

  // Add to metrics
  const metrics = [
    { label: "Projetos Totais", value: filteredProjects.length.toString() },
    { label: "Valor Estimado Total", value: `AOA ${financialMetrics.totalEstimated.toLocaleString("pt-AO")}` },
    { label: "Valor Confirmado", value: `AOA ${financialMetrics.confirmedValue.toLocaleString("pt-AO")}` },
    { label: "Taxa de Conversão Lead→Cliente", value: `${conversionRate}%` },
    { label: "Frequência de Follow-ups", value: `${followUpFrequency} por projeto` }
  ];

  // Update filters
  <ReportsFilters
    dateRange={dateRange}
    onDateChange={setDateRange}
    statusFilter={statusFilter}
    onStatusChange={setStatusFilter}
    sectorFilter={sectorFilter}
    onSectorChange={setSectorFilter}
    personaFilter={personaFilter}
    onPersonaChange={setPersonaFilter}
    lifecycleFilter={lifecycleFilter}
    onLifecycleChange={setLifecycleFilter}
    onClear={() => { setDateRange(undefined); setStatusFilter("all"); setSectorFilter("all"); setPersonaFilter("all"); setLifecycleFilter("all"); }}
  />