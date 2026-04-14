import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, format } from "date-fns";
import { RefreshCw, CalendarDays, Plus, Upload, CheckCircle } from "lucide-react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import EventSidebar from "../components/calendar/EventSidebar";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", endDate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLocalEvents();
  }, []);

  const loadLocalEvents = async () => {
    setLoading(true);
    const [orders, flashSales, products] = await Promise.all([
      base44.entities.Order.list(),
      base44.entities.FlashSale.list(),
      base44.entities.Product.list(),
    ]);

    const ev = [];

    // Order deliveries
    orders.forEach(o => {
      if (!o.expected_delivery || o.status === "cancelled") return;
      ev.push({
        type: "order",
        date: o.expected_delivery,
        title: `Delivery: ${o.supplier}`,
        description: `Status: ${o.status} · $${o.total_cost || 0}`,
      });
    });

    // Flash sales (start dates)
    flashSales.forEach(s => {
      if (!s.start_date || s.status === "ended") return;
      ev.push({
        type: "flashsale",
        date: s.start_date,
        title: `Flash Sale: ${s.product_name}`,
        description: `${s.discount_percent}% off · ${s.reason}`,
      });
    });

    // Expiring products (7 days or less)
    const today = new Date();
    products.forEach(p => {
      if (!p.expiration_date) return;
      const exp = new Date(p.expiration_date);
      const daysLeft = differenceInDays(exp, today);
      if (daysLeft >= 0 && daysLeft <= 7) {
        ev.push({
          type: "expiry",
          date: p.expiration_date,
          title: `Expires: ${p.name}`,
          description: `${daysLeft === 0 ? "Expires TODAY" : `${daysLeft}d left`} · qty: ${p.quantity_on_hand}`,
        });
      }
    });

    setEvents(ev);
    setLoading(false);
  };

  const handleDayClick = (day, dayEvents) => {
    setSelectedDay(day);
    setSelectedEvents(dayEvents);
  };

  const handleSyncToGoogle = async () => {
    setSyncing(true);
    const res = await base44.functions.invoke("calendarSync", { action: "push" });
    const count = res?.data?.results?.length ?? 0;
    setSyncCount(count);
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 5000);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.functions.invoke("calendarSync", {
      action: "create",
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      endDate: newEvent.endDate || newEvent.date,
    });
    // Also add to local display
    setEvents(prev => [...prev, {
      type: "custom",
      date: newEvent.date,
      title: newEvent.title,
      description: newEvent.description,
    }]);
    setNewEvent({ title: "", description: "", date: "", endDate: "" });
    setShowNewEvent(false);
    setSaving(false);
  };

  const syncToOutlook = () => {
    // Outlook Web Add: uses the .ics export then opens Outlook import URL
    const lines = buildICSLines();
    const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stocksense-outlook.ics";
    a.click();
    URL.revokeObjectURL(url);
    // Also open Outlook Web import page in a new tab for convenience
    window.open("https://outlook.live.com/calendar/0/addevent", "_blank");
  };

  const buildICSLines = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StockSense//Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    events.forEach(ev => {
      const dateStr = ev.date.replace(/-/g, "");
      lines.push("BEGIN:VEVENT");
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
      lines.push(`DTEND;VALUE=DATE:${dateStr}`);
      lines.push(`SUMMARY:${ev.title}`);
      if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}`);
      lines.push(`UID:stocksense-${dateStr}-${Math.random().toString(36).substr(2, 9)}`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };

  const exportICS = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StockSense//Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    const blob = new Blob([buildICSLines()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stocksense-calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Calendar</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Orders, flash sales & expiry dates at a glance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setShowNewEvent(!showNewEvent)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
          <button
            onClick={exportICS}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-4 h-4" /> Export .ics
          </button>
          <button
            onClick={syncToOutlook}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-blue-600" /> Sync to Outlook
          </button>
          <button
            onClick={handleSyncToGoogle}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> :
              syncDone ? <CheckCircle className="w-4 h-4" /> :
              <CalendarDays className="w-4 h-4" />}
            {syncing ? "Syncing..." : syncDone ? `Synced ${syncCount} event${syncCount !== 1 ? "s" : ""}!` : "Sync to Google"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { color: "bg-teal-500", label: "Order Delivery" },
          { color: "bg-amber-400", label: "Flash Sale" },
          { color: "bg-red-500", label: "Expiring Product" },
          { color: "bg-purple-500", label: "Custom Event" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* New Event Form */}
      {showNewEvent && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">Create New Event</h4>
          <form onSubmit={handleCreateEvent} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title *</label>
              <input required value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                placeholder="Event title"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Date *</label>
              <input required type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End Date</label>
              <input type="date" value={newEvent.endDate} onChange={e => setNewEvent(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-900 dark:text-slate-100" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
              <input value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional notes"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-900 dark:text-slate-100" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNewEvent(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-bold rounded-xl disabled:opacity-50">
                {saving ? "Saving..." : "Add to Calendar & Google"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
          ) : (
            <CalendarGrid events={events} onDayClick={handleDayClick} />
          )}
        </div>
        {/* Desktop sidebar hint (mobile uses bottom sheet from EventSidebar) */}
        <div className="hidden lg:block">
          {selectedDay ? (
            <EventSidebar selectedDay={selectedDay} events={selectedEvents} onClose={() => setSelectedDay(null)} />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 text-center">
              <CalendarDays className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">Tap any day to see events</p>
              <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">{events.length} total events loaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet rendered outside grid */}
      <div className="lg:hidden">
        {selectedDay && (
          <EventSidebar selectedDay={selectedDay} events={selectedEvents} onClose={() => setSelectedDay(null)} />
        )}
      </div>
    </div>
  );
}