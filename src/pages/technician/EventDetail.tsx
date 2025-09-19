<div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Equipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.roster?.teamLead && (
              <div>
                <p className="text-sm font-semibold">Responsável</p>
                <p className="text-sm text-muted-foreground">{event.roster.teamMembers.find(m => m.id === event.roster?.teamLead)?.name || 'Não definido'}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">Membros</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-2">
                {event.roster?.teamMembers.map(member => (
                  <li key={member.id}>{member.name} ({member.role})</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5" /> Materiais Alocados</CardTitle>
          </CardHeader>
          <CardContent>
            {event.roster?.materials && Object.keys(event.roster.materials).length > 0 ? (
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-2 grid md:grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(event.roster.materials).map(([id, qty]) => (
                  <li key={id}>{id}: {qty} unidade(s)</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum material alocado para este evento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" /> Tarefas do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length > 0 ? tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 text-sm p-2 border rounded-md">
              <Badge variant={task.done ? "default" : "secondary"}>{task.done ? "Concluída" : "Pendente"}</Badge>
              <span>{task.title}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa específica para este evento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianEventDetail;