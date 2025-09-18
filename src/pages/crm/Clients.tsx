const { communications } = useCommunications();

  const clientCommunications = React.useMemo(() => 
    communications.filter(c => c.client_id === client.id), [communications, client.id]
  );

  // Add timeline section
  <Card>
    <CardHeader>
      <CardTitle>Histórico de Comunicações</CardTitle>
    </CardHeader>
    <CardContent>
      {clientCommunications.length > 0 ? (
        <div className="space-y-4">
          {clientCommunications.map(comm => (
            <div key={comm.id} className="border-l-2 border-primary pl-4">
              <p className="font-medium">{comm.type} - {comm.subject || 'Sem assunto'}</p>
              <p className="text-sm text-muted-foreground">{comm.notes}</p>
              <p className="text-xs">{new Date(comm.date).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhuma comunicação registrada.</p>
      )}
    </CardContent>
  </Card>