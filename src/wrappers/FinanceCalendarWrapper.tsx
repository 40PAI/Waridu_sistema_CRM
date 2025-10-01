import FinanceCalendar from "@/pages/finance/Calendar";
import { useEvents } from "@/hooks/useEvents";

export default function FinanceCalendarWrapper() {
  const { events } = useEvents();
  return <FinanceCalendar events={events || []} />;
}
