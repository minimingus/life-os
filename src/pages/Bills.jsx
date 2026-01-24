import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Receipt, 
  Trash2,
  Zap,
  Droplets,
  Building2,
  Users,
  Flame,
  Wifi,
  Phone,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ExternalLink,
  Calendar,
  FileText,
  MessageSquare,
  Plus,
  Clock,
  Loader2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { he } from "date-fns/locale";

const BILL_TYPES = {
  electricity: { label: "חשמל", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
  water: { label: "מים", icon: Droplets, color: "bg-blue-100 text-blue-600" },
  arnona: { label: "ארנונה", icon: Building2, color: "bg-purple-100 text-purple-600" },
  vaad_bayit: { label: "ועד בית", icon: Users, color: "bg-green-100 text-green-600" },
  gas: { label: "גז", icon: Flame, color: "bg-orange-100 text-orange-600" },
  internet: { label: "אינטרנט", icon: Wifi, color: "bg-cyan-100 text-cyan-600" },
  phone: { label: "טלפון", icon: Phone, color: "bg-pink-100 text-pink-600" },
  other: { label: "אחר", icon: HelpCircle, color: "bg-slate-100 text-slate-600" }
};

const INQUIRY_STATUS = {
  open: { label: "פתוח", icon: Clock, color: "bg-amber-100 text-amber-600" },
  in_progress: { label: "בטיפול", icon: Loader2, color: "bg-blue-100 text-blue-600" },
  resolved: { label: "נפתר", icon: CheckCircle2, color: "bg-green-100 text-green-600" },
  closed: { label: "סגור", icon: CheckCircle2, color: "bg-slate-100 text-slate-600" }
};

export default function Bills() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [activeTab, setActiveTab] = useState("bills");
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const [editInquiry, setEditInquiry] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [formData, setFormData] = useState({
    type: "electricity",
    amount: "",
    billing_period: "",
    due_date: "",
    is_paid: false,
    notes: "",
    file_url: "",
    family_member_id: "",
    family_member_name: ""
  });

  const [inquiryFormData, setInquiryFormData] = useState({
    type: "electricity",
    title: "",
    description: "",
    amount_in_question: "",
    status: "open",
    contact_name: "",
    contact_phone: "",
    opened_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    file_url: "",
    family_member_id: "",
    family_member_name: ""
  });

  const [reportFormData, setReportFormData] = useState({
    title: "",
    description: "",
    period: format(new Date(), "MMMM yyyy", { locale: he }),
    total_amount: "",
    notes: "",
    file_url: "",
    created_date: format(new Date(), "yyyy-MM-dd")
  });

  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: () => base44.entities.Bill.list("-created_date")
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => base44.entities.BillInquiry.list("-created_date")
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family"],
    queryFn: () => base44.entities.FamilyMember.list()
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.Report.list("-created_date")
  });

  const parents = familyMembers.filter(m => m.role === "parent");

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bill.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bill.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bill.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] })
  });

  const createInquiryMutation = useMutation({
    mutationFn: (data) => base44.entities.BillInquiry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      resetInquiryForm();
    }
  });

  const updateInquiryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BillInquiry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      resetInquiryForm();
    }
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: (id) => base44.entities.BillInquiry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] })
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.Report.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      resetReportForm();
    }
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Report.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      resetReportForm();
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.Report.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] })
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData({
      type: "electricity",
      amount: "",
      billing_period: "",
      due_date: "",
      is_paid: false,
      notes: "",
      file_url: "",
      family_member_id: "",
      family_member_name: ""
    });
  };

  const resetInquiryForm = () => {
    setShowInquiryDialog(false);
    setEditInquiry(null);
    setInquiryFormData({
      type: "electricity",
      title: "",
      description: "",
      amount_in_question: "",
      status: "open",
      contact_name: "",
      contact_phone: "",
      opened_date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      file_url: "",
      family_member_id: "",
      family_member_name: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      paid_date: formData.is_paid ? format(new Date(), "yyyy-MM-dd") : null
    };
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      type: item.type || "electricity",
      amount: item.amount || "",
      billing_period: item.billing_period || "",
      due_date: item.due_date || "",
      is_paid: item.is_paid || false,
      notes: item.notes || "",
      file_url: item.file_url || "",
      family_member_id: item.family_member_id || "",
      family_member_name: item.family_member_name || ""
    });
    setShowDialog(true);
  };

  const togglePaid = (bill) => {
    updateMutation.mutate({
      id: bill.id,
      data: {
        ...bill,
        is_paid: !bill.is_paid,
        paid_date: !bill.is_paid ? format(new Date(), "yyyy-MM-dd") : null
      }
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url });
    }
  };

  const handleInquiryFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setInquiryFormData({ ...inquiryFormData, file_url });
    }
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    const data = {
      ...inquiryFormData,
      amount_in_question: inquiryFormData.amount_in_question ? parseFloat(inquiryFormData.amount_in_question) : null,
      resolved_date: inquiryFormData.status === "resolved" || inquiryFormData.status === "closed" 
        ? format(new Date(), "yyyy-MM-dd") 
        : null
    };
    
    if (editInquiry) {
      updateInquiryMutation.mutate({ id: editInquiry.id, data });
    } else {
      createInquiryMutation.mutate(data);
    }
  };

  const openEditInquiry = (inquiry) => {
    setEditInquiry(inquiry);
    setInquiryFormData({
      type: inquiry.type || "electricity",
      title: inquiry.title || "",
      description: inquiry.description || "",
      amount_in_question: inquiry.amount_in_question || "",
      status: inquiry.status || "open",
      contact_name: inquiry.contact_name || "",
      contact_phone: inquiry.contact_phone || "",
      opened_date: inquiry.opened_date || format(new Date(), "yyyy-MM-dd"),
      notes: inquiry.notes || "",
      file_url: inquiry.file_url || "",
      family_member_id: inquiry.family_member_id || "",
      family_member_name: inquiry.family_member_name || ""
    });
    setShowInquiryDialog(true);
  };

  let filteredBills = bills;
  if (filterType !== "all") {
    filteredBills = filteredBills.filter(b => b.type === filterType);
  }
  if (filterPaid !== "all") {
    filteredBills = filteredBills.filter(b => filterPaid === "paid" ? b.is_paid : !b.is_paid);
  }

  const today = new Date();
  const unpaidBills = bills.filter(b => !b.is_paid);
  const overdueBills = unpaidBills.filter(b => b.due_date && isBefore(parseISO(b.due_date), today));
  const urgentBills = unpaidBills.filter(b => b.due_date && isBefore(parseISO(b.due_date), addDays(today, 7)) && !isBefore(parseISO(b.due_date), today));
  
  const totalUnpaid = unpaidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  const getDueStatus = (bill) => {
    if (bill.is_paid) return null;
    if (!bill.due_date) return null;
    
    const dueDate = parseISO(bill.due_date);
    if (isBefore(dueDate, today)) {
      return { text: "באיחור", color: "bg-rose-100 text-rose-600" };
    }
    if (isBefore(dueDate, addDays(today, 3))) {
      return { text: "דחוף", color: "bg-orange-100 text-orange-600" };
    }
    if (isBefore(dueDate, addDays(today, 7))) {
      return { text: "השבוע", color: "bg-amber-100 text-amber-600" };
    }
    return null;
  };

  const openInquiries = inquiries.filter(i => i.status === "open" || i.status === "in_progress");

  return (
    <div className="space-y-6">
      <PageHeader
        title="ניהול חשבונות ותשלומים"
        subtitle="חשבונות, בירורים ודוחות"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bills">
            <Receipt className="w-4 h-4 ml-2" />
            חשבונות ({unpaidBills.length})
          </TabsTrigger>
          <TabsTrigger value="inquiries">
            <MessageSquare className="w-4 h-4 ml-2" />
            בירורים ({openInquiries.length})
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 ml-2" />
            דוחות
          </TabsTrigger>
        </TabsList>

        {/* Bills Tab */}
        <TabsContent value="bills" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowDialog(true)} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              הוסף חשבון
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">סה"כ לתשלום</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">₪{totalUnpaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">ממתינים</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{unpaidBills.length}</p>
        </div>
        {overdueBills.length > 0 && (
          <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
            <p className="text-sm text-rose-600">באיחור</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{overdueBills.length}</p>
          </div>
        )}
        {urgentBills.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
            <p className="text-sm text-amber-600">השבוע</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{urgentBills.length}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterPaid === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPaid("all")}
            className={filterPaid === "all" ? "bg-blue-500" : ""}
          >
            הכל
          </Button>
          <Button
            variant={filterPaid === "unpaid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPaid("unpaid")}
            className={filterPaid === "unpaid" ? "bg-blue-500" : ""}
          >
            לתשלום
          </Button>
          <Button
            variant={filterPaid === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPaid("paid")}
            className={filterPaid === "paid" ? "bg-blue-500" : ""}
          >
            שולמו
          </Button>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="סוג חשבון" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            {Object.entries(BILL_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {bills.length === 0 && !isLoading ? (
        <EmptyState
          icon={Receipt}
          title="אין חשבונות"
          description="הוסף חשבונות לניהול ומעקב התשלומים"
          action={() => setShowDialog(true)}
          actionLabel="הוסף חשבון"
        />
      ) : (
        <div className="grid gap-3">
          {filteredBills.map(bill => {
            const typeConfig = BILL_TYPES[bill.type] || BILL_TYPES.other;
            const TypeIcon = typeConfig.icon;
            const dueStatus = getDueStatus(bill);
            
            return (
              <div 
                key={bill.id}
                className={cn(
                  "bg-white rounded-2xl border p-4 hover:shadow-md transition-all cursor-pointer",
                  bill.is_paid ? "opacity-60" : "border-slate-100",
                  dueStatus?.color.includes("rose") && !bill.is_paid && "border-rose-200"
                )}
                onClick={() => openEdit(bill)}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={bill.is_paid}
                    onCheckedChange={(e) => {
                      e.stopPropagation?.();
                      togglePaid(bill);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeConfig.color)}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-semibold text-slate-800",
                        bill.is_paid && "line-through text-slate-500"
                      )}>
                        {typeConfig.label}
                      </p>
                      {bill.is_paid && (
                        <Badge className="bg-green-100 text-green-600 border-0">
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          שולם
                        </Badge>
                      )}
                      {dueStatus && (
                        <Badge className={cn(dueStatus.color, "border-0")}>
                          {dueStatus.text}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      {bill.billing_period && <span>{bill.billing_period}</span>}
                      {bill.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(bill.due_date), "dd/MM/yyyy")}
                        </span>
                      )}
                      {bill.family_member_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {bill.family_member_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-xl font-bold text-slate-800">₪{bill.amount?.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {bill.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-slate-400 hover:text-blue-500"
                      >
                        <a href={bill.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(bill.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowInquiryDialog(true)} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              פתח בירור
            </Button>
          </div>

          {inquiries.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="אין בירורים"
              description="כל הבירורים על חשבונות יופיעו כאן"
              action={() => setShowInquiryDialog(true)}
              actionLabel="פתח בירור"
            />
          ) : (
            <div className="grid gap-3">
              {inquiries.map(inquiry => {
                const typeConfig = BILL_TYPES[inquiry.type] || BILL_TYPES.other;
                const TypeIcon = typeConfig.icon;
                const statusConfig = INQUIRY_STATUS[inquiry.status] || INQUIRY_STATUS.open;
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div 
                    key={inquiry.id}
                    className={cn(
                      "bg-white rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer",
                      inquiry.status === "resolved" || inquiry.status === "closed" ? "opacity-60" : "border-slate-100"
                    )}
                    onClick={() => openEditInquiry(inquiry)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeConfig.color)}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-800">{inquiry.title}</h3>
                            {inquiry.description && (
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{inquiry.description}</p>
                            )}
                          </div>
                          <Badge className={cn(statusConfig.color, "border-0 flex-shrink-0")}>
                            <StatusIcon className={cn("w-3 h-3 ml-1", inquiry.status === "in_progress" && "animate-spin")} />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          {inquiry.amount_in_question && (
                            <span className="font-medium text-orange-600">סכום במחלוקת: ₪{inquiry.amount_in_question.toLocaleString()}</span>
                          )}
                          {inquiry.contact_name && (
                            <span>איש קשר: {inquiry.contact_name}</span>
                          )}
                          {inquiry.opened_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(inquiry.opened_date), "dd/MM/yyyy")}
                            </span>
                          )}
                          {inquiry.family_member_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {inquiry.family_member_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInquiryMutation.mutate(inquiry.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowInquiryDialog(true)} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              הוסף דוח
            </Button>
          </div>
          <div className="grid gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">סיכום חודשי</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-slate-600">סה"כ שולם החודש</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    ₪{bills.filter(b => b.is_paid && b.paid_date && b.paid_date.startsWith(format(new Date(), "yyyy-MM"))).reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-slate-600">ממוצע חודשי</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    ₪{Math.round(bills.filter(b => b.is_paid).reduce((sum, b) => sum + (b.amount || 0), 0) / Math.max(bills.filter(b => b.is_paid).length, 1)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">פירוט לפי סוג</h3>
              <div className="space-y-3">
                {Object.entries(BILL_TYPES).map(([key, { label, icon: Icon, color }]) => {
                  const typeBills = bills.filter(b => b.type === key);
                  const total = typeBills.reduce((sum, b) => sum + (b.amount || 0), 0);
                  if (total === 0) return null;
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-700">{label}</span>
                      </div>
                      <span className="font-bold text-slate-800">₪{total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Bill Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editItem ? "עריכת חשבון" : "הוספת חשבון"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">סוג החשבון</label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BILL_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">סכום (₪)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תקופת חיוב</label>
              <Input
                value={formData.billing_period}
                onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                placeholder="למשל: ינואר-פברואר 2024"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תאריך לתשלום</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">הורה אחראי</label>
              <Select
                value={formData.family_member_id}
                onValueChange={(v) => {
                  const parent = parents.find(p => p.id === v);
                  setFormData({ 
                    ...formData, 
                    family_member_id: v,
                    family_member_name: parent?.name || ""
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר הורה (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא שיוך</SelectItem>
                  {parents.map(parent => (
                    <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
              />
              <label htmlFor="is_paid" className="text-sm font-medium text-slate-700">
                שולם
              </label>
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

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium text-slate-700">קובץ החשבון</label>
              {formData.file_url ? (
                <div className="mt-2 flex items-center gap-2">
                  <a 
                    href={formData.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    צפה בקובץ
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, file_url: "" })}
                    className="text-rose-500"
                  >
                    הסר
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">העלה קובץ</span>
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editItem ? "עדכן" : "הוסף"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Inquiry Dialog */}
      <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editInquiry ? "עריכת בירור" : "פתיחת בירור חדש"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">סוג החשבון</label>
              <Select
                value={inquiryFormData.type}
                onValueChange={(v) => setInquiryFormData({ ...inquiryFormData, type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BILL_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">כותרת הבירור</label>
              <Input
                value={inquiryFormData.title}
                onChange={(e) => setInquiryFormData({ ...inquiryFormData, title: e.target.value })}
                placeholder="למשל: חיוב כפול בחשבון המים"
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">תיאור הבעיה</label>
              <Textarea
                value={inquiryFormData.description}
                onChange={(e) => setInquiryFormData({ ...inquiryFormData, description: e.target.value })}
                placeholder="פרט את הבעיה והסיבה לבירור..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">סכום במחלוקת (₪)</label>
                <Input
                  type="number"
                  value={inquiryFormData.amount_in_question}
                  onChange={(e) => setInquiryFormData({ ...inquiryFormData, amount_in_question: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">סטטוס</label>
                <Select
                  value={inquiryFormData.status}
                  onValueChange={(v) => setInquiryFormData({ ...inquiryFormData, status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INQUIRY_STATUS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">שם איש קשר</label>
                <Input
                  value={inquiryFormData.contact_name}
                  onChange={(e) => setInquiryFormData({ ...inquiryFormData, contact_name: e.target.value })}
                  placeholder="למשל: משה כהן"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">טלפון</label>
                <Input
                  value={inquiryFormData.contact_phone}
                  onChange={(e) => setInquiryFormData({ ...inquiryFormData, contact_phone: e.target.value })}
                  placeholder="050-1234567"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">הורה אחראי</label>
              <Select
                value={inquiryFormData.family_member_id}
                onValueChange={(v) => {
                  const parent = parents.find(p => p.id === v);
                  setInquiryFormData({ 
                    ...inquiryFormData, 
                    family_member_id: v,
                    family_member_name: parent?.name || ""
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר הורה (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא שיוך</SelectItem>
                  {parents.map(parent => (
                    <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">הערות והתפתחויות</label>
              <Textarea
                value={inquiryFormData.notes}
                onChange={(e) => setInquiryFormData({ ...inquiryFormData, notes: e.target.value })}
                placeholder="הוסף הערות, מעקב אחר שיחות וכו'..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium text-slate-700">קובץ מסמך</label>
              {inquiryFormData.file_url ? (
                <div className="mt-2 flex items-center gap-2">
                  <a 
                    href={inquiryFormData.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    צפה בקובץ
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInquiryFormData({ ...inquiryFormData, file_url: "" })}
                    className="text-rose-500"
                  >
                    הסר
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleInquiryFileUpload}
                  />
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">העלה קובץ</span>
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                {editInquiry ? "עדכן" : "פתח בירור"}
              </Button>
              <Button type="button" variant="outline" onClick={resetInquiryForm}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}