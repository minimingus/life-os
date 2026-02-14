import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { period } = await req.json();
    
    // Fetch data
    const expenses = await base44.entities.Expense.list();
    const tasks = await base44.entities.Task.list();
    const bills = await base44.entities.Bill.list();
    const projects = await base44.entities.Project.list();

    // Create PDF
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(24);
    doc.text('דוח ניתוח חודשי', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    const currentDate = new Date().toLocaleDateString('he-IL');
    doc.text(`תאריך: ${currentDate}`, 105, 30, { align: 'center' });
    
    // Summary Statistics
    doc.setFontSize(16);
    doc.text('סטטיסטיקה כללית', 20, 50);
    
    doc.setFontSize(12);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const unpaidBills = bills.filter(b => !b.is_paid).length;
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    
    let y = 60;
    doc.text(`סה"כ הוצאות: ₪${totalExpenses.toLocaleString()}`, 20, y);
    y += 10;
    doc.text(`משימות שהושלמו: ${completedTasks} מתוך ${tasks.length}`, 20, y);
    y += 10;
    doc.text(`חשבונות ממתינים: ${unpaidBills}`, 20, y);
    y += 10;
    doc.text(`פרויקטים פעילים: ${activeProjects}`, 20, y);
    
    // Expenses Breakdown
    y += 20;
    doc.setFontSize(16);
    doc.text('פירוט הוצאות', 20, y);
    
    y += 10;
    doc.setFontSize(10);
    const categories = {};
    expenses.forEach(e => {
      if (!categories[e.category]) categories[e.category] = 0;
      categories[e.category] += e.amount;
    });
    
    Object.entries(categories).forEach(([cat, amount]) => {
      y += 8;
      doc.text(`${cat}: ₪${amount.toLocaleString()}`, 20, y);
    });
    
    // Recent Activities
    if (y > 250) {
      doc.addPage();
      y = 20;
    } else {
      y += 20;
    }
    
    doc.setFontSize(16);
    doc.text('פעילות אחרונה', 20, y);
    
    y += 10;
    doc.setFontSize(10);
    const recentExpenses = expenses.slice(0, 10);
    recentExpenses.forEach(exp => {
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${exp.description || exp.category}: ₪${exp.amount}`, 20, y);
    });
    
    // Footer
    doc.setFontSize(8);
    doc.text('נוצר אוטומטית על ידי מערכת ניהול הבית', 105, 290, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=analytics-report.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});