import Calendar from "@/pages/Calendar";
import { useEvents } from "@/hooks/useEvents";

export default function CalendarWrapper() {
  const { events } = useEvents();
  return <Calendar events={events || []} />;
}
