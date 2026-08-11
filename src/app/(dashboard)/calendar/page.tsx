import { CalendarBoard } from "@/components/calendar/CalendarBoard";

export default async function CalendarPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">캘린더</h1>
      <CalendarBoard />
    </div>
  );
}
