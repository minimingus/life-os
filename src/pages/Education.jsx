import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User
} from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

const testTypes = {
  exam: { label: "מבחן", color: "bg-red-100 text-red-700 dark:bg-red-900/30" },
  quiz: { label: "בוחן", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30" },
  assignment: { label: "עבודה", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30" },
  project: { label: "פרויקט", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30" },
  oral: { label: "בעל פה", color: "bg-green-100 text-green-700 dark:bg-green-900/30" },
  participation: { label: "השתתפות", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30" }
};

export default function Education() {
  const [activeTab, setActiveTab] = useState("homework");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data: homework = [] } = useQuery({
    queryKey: ["homework"],
    queryFn: () => base44.entities.Homework.list("-due_date")
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => base44.entities.Grade.list("-date")
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["familyMembers"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const students = familyMembers.filter(m => m.role === "child");

  const pendingHomework = homework.filter(h => h.status !== "completed");
  const overdueHomework = pendingHomework.filter(h => isBefore(parseISO(h.due_date), new Date()));
  const todayHomework = pendingHomework.filter(h => {
    const due = parseISO(h.due_date);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  });

  const gradesByStudent = useMemo(() => {
    const result = {};
    grades.forEach(g => {
      if (!result[g.family_member_name]) result[g.family_member_name] = [];
      result[g.family_member_name].push(g);
    });
    return result;
  }, [grades]);

  const calculateAverage = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return 0;
    const sum = studentGrades.reduce((acc, g) => acc + (g.grade / g.max_grade) * 100, 0);
    return Math.round(sum / studentGrades.length);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="חינוך ולמידה"
        subtitle={`${pendingHomework.length} שיעורי בית • ${grades.length} ציונים`}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">שיעורים להיום</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {todayHomework.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">באיחור</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {overdueHomework.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">ציונים חדשים</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {grades.filter(g => {
                    const weekAgo = addDays(new Date(), -7);
                    return !isBefore(parseISO(g.date), weekAgo);
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="homework">שיעורי בית ({homework.length})</TabsTrigger>
          <TabsTrigger value="grades">ציונים ({grades.length})</TabsTrigger>
        </TabsList>

        {/* Homework Tab */}
        <TabsContent value="homework" className="space-y-4 mt-6">
          {overdueHomework.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  שיעורים באיחור
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueHomework.map(hw => (
                  <div key={hw.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{hw.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {hw.family_member_name} • {hw.subject}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {format(parseISO(hw.due_date), "d בMMM", { locale: he })}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {homework.map(hw => {
              const isOverdue = hw.status !== "completed" && isBefore(parseISO(hw.due_date), new Date());
              const isToday = parseISO(hw.due_date).toDateString() === new Date().toDateString();
              
              return (
                <Card key={hw.id} className={cn(
                  hw.status === "completed" && "opacity-60",
                  isOverdue && "border-r-4 border-r-red-500"
                )}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {hw.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">
                              <CheckCircle2 className="w-3 h-3 ml-1" />
                              הושלם
                            </Badge>
                          ) : (
                            <Badge className={
                              hw.priority === "high" 
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                                : hw.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                            }>
                              {hw.priority === "high" ? "דחוף" : hw.priority === "medium" ? "בינוני" : "נמוך"}
                            </Badge>
                          )}
                          {isToday && <Badge variant="outline">היום</Badge>}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {hw.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {hw.family_member_name} • {hw.subject}
                        </p>
                      </div>
                    </div>

                    {hw.description && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                        {hw.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          הגשה: {format(parseISO(hw.due_date), "d בMMMM", { locale: he })}
                        </span>
                      </div>
                      {hw.estimated_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{hw.estimated_time} דקות</span>
                        </div>
                      )}
                      {hw.teacher && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{hw.teacher}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4 mt-6">
          {/* Student Averages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(student => {
              const studentGrades = gradesByStudent[student.name] || [];
              const average = calculateAverage(studentGrades);
              
              return (
                <Card key={student.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {student.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {studentGrades.length} ציונים
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">ממוצע</span>
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {average}
                      </span>
                    </div>
                    <Progress value={average} className="mt-2 h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Grades */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">ציונים אחרונים</h3>
            {grades.map(grade => {
              const typeConfig = testTypes[grade.test_type] || testTypes.exam;
              const percentage = (grade.grade / grade.max_grade) * 100;
              
              return (
                <Card key={grade.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {grade.subject}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {grade.test_name || grade.subject}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {grade.family_member_name}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className={cn(
                          "text-3xl font-bold",
                          percentage >= 90 ? "text-green-600 dark:text-green-400" :
                          percentage >= 70 ? "text-blue-600 dark:text-blue-400" :
                          percentage >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                          "text-red-600 dark:text-red-400"
                        )}>
                          {grade.grade}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          / {grade.max_grade}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(grade.date), "d בMMM yyyy", { locale: he })}</span>
                      </div>
                      {grade.class_average && (
                        <div className="flex items-center gap-1">
                          {grade.grade > grade.class_average ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span>ממוצע כיתה: {grade.class_average}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}