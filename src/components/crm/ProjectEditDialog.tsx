const [newCommunication, setNewCommunication] = React.useState({ type: 'note' as Communication['type'], subject: '', notes: '' });

  const handleAddCommunication = async () => {
    if (!newCommunication.notes.trim()) return;
    await createCommunication({
      client_id: project.client_id,
      project_id: project.id,
      type: newCommunication.type,
      subject: newCommunication.subject,
      notes: newCommunication.notes,
      user_id: user?.id || '',
      date: new Date().toISOString()
    });
    setNewCommunication({ type: 'note', subject: '', notes: '' });
  };

  // Add to followups tab
  <div className="space-y-2">
    <Label htmlFor="comm-type">Tipo</Label>
    <Select value={newCommunication.type} onValueChange={(v) => setNewCommunication(prev => ({ ...prev, type: v as Communication['type'] }))}>
      <SelectTrigger id="comm-type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="email">Email</SelectItem>
        <SelectItem value="call">Chamada</SelectItem>
        <SelectItem value="meeting">Reunião</SelectItem>
        <SelectItem value="note">Nota</SelectItem>
      </SelectContent>
    </Select>
    <Input placeholder="Assunto (opcional)" value={newCommunication.subject} onChange={(e) => setNewCommunication(prev => ({ ...prev, subject: e.target.value }))} />
    <Textarea placeholder="Detalhes da comunicação" value={newCommunication.notes} onChange={(e) => setNewCommunication(prev => ({ ...prev, notes: e.target.value }))} />
    <Button onClick={handleAddCommunication}>Registrar Comunicação</Button>
  </div>