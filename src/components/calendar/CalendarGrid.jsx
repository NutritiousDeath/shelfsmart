import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

const EVENT_COLORS = {
  order: "bg-teal-500",
  flashsale: "bg-amber-400",
  custom: "bg-purple-500",
  expiry: "bg-red-500",
};

export default function CalendarGrid({ events, onDayClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (d) =>
    events.filter(e => {
      const eDate = new Date(e.date);
      return isSameDay(eDate, d);
    });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels - abbreviated on mobile */}
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
        {[["S","Sun"],["M","Mon"],["T","Tue"],["W","Wed"],["T","Thu"],["F","Fri"],["S","Sat"]].map(([short, full], i) => (
          <div key={i} className="py-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{full}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const dayEvents = getEventsForDay(d);
          const isToday = isSameDay(d, new Date());
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const hasEvents = dayEvents.length > 0;
          return (
            <div
              key={i}
              onClick={() => onDayClick && onDayClick(d, dayEvents)}
              className={`min-h-[44px] sm:min-h-[72px] p-1 sm:p-1.5 border-b border-r border-slate-50 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                !isCurrentMonth ? "bg-slate-50/50 dark:bg-slate-900/50" : ""
              }`}
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-0.5 ${
                isToday ? "bg-amber-400 text-slate-900 font-bold" : isCurrentMonth ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"
              }`}>
                {format(d, "d")}
              </div>
              {/* Mobile: dots only */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.type] || "bg-slate-400"}`} />
                ))}
              </div>
              {/* Desktop: full labels */}
              <div className="hidden sm:block space-y-0.5">
                {dayEvents.slice(0, 2).map((e, idx) => (
                  <div key={idx} className={`${EVENT_COLORS[e.type] || "bg-slate-400"} text-white text-[10px] px-1.5 py-0.5 rounded truncate`}>
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}