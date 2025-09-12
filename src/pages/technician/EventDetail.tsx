// ...
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, done')
    .eq('event_id', eventId)
    .maybeSingle();
  // ...