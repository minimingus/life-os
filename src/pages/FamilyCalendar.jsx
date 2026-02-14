import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Clock,
  MapPin,
  GraduationCap,
  Music,
  PartyPopper,
  Stethoscope,
  MoreHorizontal,
  Repeat,
  RefreshCw,
  Upload,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday
} from "date-fns";
import { he } from "date-fns/locale";

const EVENT_TYPES = {
  school: { label: "בית ספר", icon: GraduationCap, color: "bg-blue-500" },
  activity: { label: "חוג", icon: Music, color: "bg-purple-500" },
  event: { label: "אירוע", icon: PartyPopper, color: "bg-pink-500" },
  appointment: { label: "פגישה/תור", icon: Stethoscope, color: "bg-green-500" },
  other: { label: "אחר", icon: MoreHorizontal, color: "bg-slate-500" }
};

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function FamilyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "event",
    family_member_id: "",
    family_member_name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "",
    end_time: "",
    is_recurring: false,
    recurrence_days: [],
    location: "",
    notes: "",
    color: ""
  });

  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.CalendarEvent.list()
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] })
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const syncGoogleCalendar = async (direction) => {
    setIsSyncing(true);
    try {
      const response = await base44.functions.invoke('syncGoogleCalendar', { direction });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      alert(response.data.message);
    } catch (error) {
      alert('שגיאה בסנכרון');
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditEvent(null);
    setFormData({
      title: "",
      type: "event",
      family_member_id: "",
      family_member_name: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      start_time: "",
      end_time: "",
      is_recurring: false,
      recurrence_days: [],
      location: "",
      notes: "",
      color: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const member = familyMembers.find(m => m.id === formData.family_member_id);
    const data = {
      ...formData,
      family_member_name: member?.name || "",
      color: member?.color || formData.color || "#3b82f6"
    };
    
    if (editEvent) {
      updateMutation.mutate({ id: editEvent.id, data });
    } else {
      createMutation.mutate({
        ...data,
        _idempotency_key: `calendar_event_${Date.now()}_${Math.random()}`
      });
    }
  };

  const openAddEvent = (date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      date: format(date, "yyyy-MM-dd")
    });
    setShowDialog(true);
  };

  const openEditEvent = (event) => {
    setEditEvent(event);
    setFormData({
      title: event.title || "",
      type: event.type || "event",
      family_member_id: event.family_member_id || "",
      family_member_name: event.family_member_name || "",
      date: event.date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      is_recurring: event.is_recurring || false,
      recurrence_days: event.recurrence_days || [],
      location: event.location || "",
      notes: event.notes || "",
      color: event.color || ""
    });
    setShowDialog(true);
  };

  const toggleRecurrenceDay = (day) => {
    const days = formData.recurrence_days || [];
    if (days.includes(day)) {
      setFormData({ ...formData, recurrence_days: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, recurrence_days: [...days, day].sort() });
    }
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();
    
    return events.filter(event => {
      // Check direct date match
      if (event.date === dateStr) return true;
      
      // Check recurring events
      if (event.is_recurring && event.recurrence_days?.includes(dayOfWeek)) {
        return true;
      }
      
      return false;
    });
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="יומן משפחתי"
        subtitle={format(currentMonth, "MMMM yyyy", { locale: he })}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncGoogleCalendar('import')}
              disabled={isSyncing}
            >
              <Download className="w-4 h-4 ml-1" />
              ייבא
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncGoogleCalendar('export')}
              disabled={isSyncing}
            >
              <Upload className="w-4 h-4 ml-1" />
              ייצא
            </Button>
            <Button onClick={() => openAddEvent(selectedDate)}>
              <Plus className="w-4 h-4 ml-1" />
              אירוע חדש
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-800">
              {format(currentMonth, "MMMM yyyy", { locale: he })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS_HE.map((day, idx) => (
              <div 
                key={idx}
                className={cn(
                  "py-3 text-center text-sm font-medium",
                  idx === 6 ? "text-blue-600" : "text-slate-600"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, idx) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);
              
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "min-h-24 p-2 border-b border-l border-slate-100 cursor-pointer transition-colors",
                    !isCurrentMonth && "bg-slate-50",
                    isSelected && "bg-blue-50",
                    "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1",
                    isCurrentDay && "bg-blue-500 text-white font-bold",
                    !isCurrentDay && isCurrentMonth && "text-slate-700",
                    !isCurrentMonth && "text-slate-400"
                  )}>
                    {format(date, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id + "-" + i}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEvent(event);
                        }}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: event.color || "#3b82f6" }}
                      >
                        {event.start_time && `${event.start_time} `}
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500 px-1">
                        +{dayEvents.length - 3} נוספים
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">
                {format(selectedDate, "EEEE", { locale: he })}
              </h3>
              <p className="text-sm text-slate-500">
                {format(selectedDate, "d בMMMM", { locale: he })}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => openAddEvent(selectedDate)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-4">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>אין אירועים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map(event => {
                  const typeConfig = EVENT_TYPES[event.type] || EVENT_TYPES.other;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => openEditEvent(event)}
                      className="p-3 rounded-xl border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-1 h-full min-h-12 rounded-full"
                          style={{ backgroundColor: event.color || "#3b82f6" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-slate-400" />
                            <p className="font-medium text-slate-800">{event.title}</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.start_time}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            )}
                            {event.family_member_name && (
                              <Badge variant="secondary" className="text-xs">
                                {event.family_member_name}
                              </Badge>
                            )}
                            {event.is_recurring && (
                              <Repeat className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                          
                          {event.location && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(event.id);
                          }}
                          className="text-slate-400 hover:text-rose-500 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editEvent ? "עריכת אירוע" : "אירוע חדש"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">כותרת</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: שיעור פסנתר"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">סוג</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">עבור</label>
                <Select
                  value={formData.family_member_id}
                  onValueChange={(v) => setFormData({ ...formData, family_member_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר בן משפחה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>כל המשפחה</SelectItem>
                    {familyMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תאריך</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">שעת התחלה</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">שעת סיום</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">מיקום</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="כתובת או שם מקום"
                className="mt-1"
              />
            </div>

            {/* Recurring */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <label htmlFor="is_recurring" className="text-sm font-medium text-slate-700">
                  אירוע חוזר
                </label>
              </div>
              
              {formData.is_recurring && (
                <div>
                  <label className="text-sm text-slate-600">חזור בימים:</label>
                  <div className="flex gap-2 mt-2">
                    {DAYS_HE.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleRecurrenceDay(idx)}
                        className={cn(
                          "w-9 h-9 rounded-full text-sm font-medium transition-colors",
                          formData.recurrence_days?.includes(idx)
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">הערות</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות נוספות..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editEvent ? "עדכן" : "הוסף"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}