import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Pill,
  Syringe,
  Plus,
  Clock,
  MapPin,
  Phone,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bell
} from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const appointmentTypes = {
  general: { label: "רופא משפחה", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  specialist: { label: "מומחה", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  dentist: { label: "שיניים", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  eye: { label: "עיניים", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  lab: { label: "מעבדה", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  imaging: { label: "הדמיה", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  therapy: { label: "טיפול", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  other: { label: "אחר", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" }
};

const frequencyLabels = {
  once_daily: "פעם ביום",
  twice_daily: "פעמיים ביום",
  three_times: "3 פעמים ביום",
  as_needed: "לפי הצורך",
  weekly: "שבועי",
  monthly: "חודשי"
};

export default function Health() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [showDialog, setShowDialog] = useState({ type: null, item: null });
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.MedicalAppointment.list("-date")
  });

  const { data: medications = [] } = useQuery({
    queryKey: ["medications"],
    queryFn: () => base44.entities.Medication.list()
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["vaccinations"],
    queryFn: () => base44.entities.Vaccination.list("-date_given")
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const upcomingAppointments = appointments.filter(a => 
    a.status === "scheduled" && !isBefore(parseISO(a.date), new Date())
  );

  const activeMedications = medications.filter(m => m.is_active);

  const openDialog = (type, item = null) => {
    setShowDialog({ type, item });
  };

  const closeDialog = () => {
    setShowDialog({ type: null, item: null });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="בריאות המשפחה"
        subtitle={`${upcomingAppointments.length} תורים קרובים • ${activeMedications.length} תרופות פעילות`}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">תורים קרובים</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {upcomingAppointments.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">תרופות פעילות</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeMedications.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Pill className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">חיסונים</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {vaccinations.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Syringe className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">
            תורים ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="medications">
            תרופות ({medications.length})
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
            חיסונים ({vaccinations.length})
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4 mt-6">
          <Button onClick={() => openDialog('appointment')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            תור חדש
          </Button>

          {appointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 dark:text-slate-400">אין תורים רשומים</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map(apt => {
                const typeConfig = appointmentTypes[apt.type] || appointmentTypes.other;
                const isPast = isBefore(parseISO(apt.date), new Date());
                
                return (
                  <Card key={apt.id} className={cn(
                    isPast && apt.status !== "completed" && "opacity-60"
                  )}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={typeConfig.color}>
                              {typeConfig.label}
                            </Badge>
                            {apt.status === "completed" && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">
                                <CheckCircle2 className="w-3 h-3 ml-1" />
                                בוצע
                              </Badge>
                            )}
                            {apt.status === "cancelled" && (
                              <Badge variant="outline" className="text-red-600">
                                בוטל
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {apt.doctor_name || apt.clinic_name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {apt.family_member_name} • {apt.reason || "ביקור רגיל"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(parseISO(apt.date), "d בMMMM yyyy", { locale: he })}</span>
                        </div>
                        {apt.time && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{apt.time}</span>
                          </div>
                        )}
                        {apt.address && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{apt.address}</span>
                          </div>
                        )}
                        {apt.phone && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Phone className="w-4 h-4" />
                            <span>{apt.phone}</span>
                          </div>
                        )}
                      </div>

                      {apt.notes && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{apt.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4 mt-6">
          <Button onClick={() => openDialog('medication')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            תרופה חדשה
          </Button>

          {medications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Pill className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 dark:text-slate-400">אין תרופות רשומות</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {medications.map(med => (
                <Card key={med.id} className={cn(!med.is_active && "opacity-50")}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {med.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {med.family_member_name} • {med.dosage}
                        </p>
                      </div>
                      {med.is_active ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">
                          פעיל
                        </Badge>
                      ) : (
                        <Badge variant="outline">לא פעיל</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{frequencyLabels[med.frequency] || med.frequency}</span>
                        {med.times && med.times.length > 0 && (
                          <span>• {med.times.join(", ")}</span>
                        )}
                      </div>
                      {med.purpose && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                          <FileText className="w-4 h-4 mt-0.5" />
                          <span>{med.purpose}</span>
                        </div>
                      )}
                      {med.prescribing_doctor && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <User className="w-4 h-4" />
                          <span>ד״ר {med.prescribing_doctor}</span>
                        </div>
                      )}
                      {med.quantity_left !== undefined && med.quantity_left < 10 && (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>נותרו {med.quantity_left} יחידות - יש להזמין מרשם</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="space-y-4 mt-6">
          <Button onClick={() => openDialog('vaccination')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            חיסון חדש
          </Button>

          {vaccinations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Syringe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 dark:text-slate-400">אין חיסונים רשומים</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vaccinations.map(vac => (
                <Card key={vac.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {vac.vaccine_name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {vac.family_member_name}
                        </p>
                      </div>
                      {vac.series_number && vac.total_in_series && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                          מנה {vac.series_number}/{vac.total_in_series}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(vac.date_given), "d בMMMM yyyy", { locale: he })}</span>
                      </div>
                      {vac.location && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{vac.location}</span>
                        </div>
                      )}
                      {vac.next_dose_date && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Bell className="w-4 h-4" />
                          <span>
                            מנה הבאה: {format(parseISO(vac.next_dose_date), "d בMMMM yyyy", { locale: he })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs would go here - simplified for brevity */}
    </div>
  );
}