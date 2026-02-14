import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch AI settings
    const settingsList = await base44.asServiceRole.entities.AISettings.list();
    const settings = settingsList[0] || {
      spending_alerts_enabled: true,
      spending_threshold_percentage: 20,
      inventory_expiry_alerts_enabled: true,
      inventory_expiry_days: 7,
      shopping_suggestions_enabled: true,
      bill_reminders_enabled: true,
      bill_reminder_days: 5,
      repair_priority_alerts_enabled: true,
      budget_warnings_enabled: true
    };

    // Fetch all relevant data
    const [bills, inventory, shopping, repairs, projects, budgets] = await Promise.all([
      base44.asServiceRole.entities.Bill.list(),
      base44.asServiceRole.entities.InventoryItem.list(),
      base44.asServiceRole.entities.ShoppingItem.list(),
      base44.asServiceRole.entities.Repair.list(),
      base44.asServiceRole.entities.Project.list(),
      base44.asServiceRole.entities.FamilyBudget.list()
    ]);

    const insights = [];
    const today = new Date();

    // 1. Spending Analysis
    if (settings.spending_alerts_enabled) {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentMonthBills = bills.filter(b => {
        const billDate = new Date(b.created_date);
        return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
      });
      
      const currentMonthTotal = currentMonthBills.reduce((sum, b) => sum + (b.amount || 0), 0);
      
      // Calculate average from previous months
      const previousMonthsBills = bills.filter(b => {
        const billDate = new Date(b.created_date);
        return billDate < new Date(currentYear, currentMonth, 1);
      });
      
      const monthlyTotals = {};
      previousMonthsBills.forEach(b => {
        const billDate = new Date(b.created_date);
        const key = `${billDate.getFullYear()}-${billDate.getMonth()}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + (b.amount || 0);
      });
      
      const monthlyValues = Object.values(monthlyTotals);
      const avgMonthlySpending = monthlyValues.length > 0 
        ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length 
        : 0;
      
      if (avgMonthlySpending > 0) {
        const percentageDiff = ((currentMonthTotal - avgMonthlySpending) / avgMonthlySpending) * 100;
        
        if (percentageDiff > settings.spending_threshold_percentage) {
          insights.push({
            type: "spending_alert",
            priority: percentageDiff > 50 ? "urgent" : "high",
            title: `הוצאות גבוהות ב-${Math.round(percentageDiff)}% מהממוצע`,
            description: `החודש הוצאת ₪${currentMonthTotal.toLocaleString()}, לעומת ממוצע של ₪${Math.round(avgMonthlySpending).toLocaleString()}. כדאי לבדוק את ההוצאות ולזהות חריגות.`,
            related_data: {
              current_total: currentMonthTotal,
              average_total: avgMonthlySpending,
              percentage_diff: percentageDiff
            },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }

    // 2. Inventory Expiry Analysis
    if (settings.inventory_expiry_alerts_enabled) {
      const expiringItems = inventory.filter(item => {
        if (!item.expiry_date) return false;
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= settings.inventory_expiry_days;
      });

      if (expiringItems.length > 0) {
        insights.push({
          type: "inventory_expiry",
          priority: "high",
          title: `${expiringItems.length} פריטים עומדים לפוג תוקף`,
          description: `פריטים אלה יפגו תוקף בימים הקרובים: ${expiringItems.map(i => i.name).join(', ')}. כדאי לתכנן שימוש או להקפיא.`,
          action_items: expiringItems.map(item => ({
            label: `שתמש ב-${item.name}`,
            action: "mark_for_use",
            data: { item_id: item.id, item_name: item.name }
          })),
          related_data: {
            items: expiringItems.map(i => ({ id: i.id, name: i.name, expiry_date: i.expiry_date }))
          },
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // 3. Smart Shopping Suggestions
    if (settings.shopping_suggestions_enabled) {
      const prompt = `
        נתח את נתוני המלאי והקניות הבאים והצע המלצות חכמות לקניות:
        
        מלאי נוכחי: ${JSON.stringify(inventory.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          is_staple: i.is_staple,
          status: i.status
        })))}
        
        רשימת קניות נוכחית: ${JSON.stringify(shopping.filter(s => !s.is_purchased).map(s => s.name))}
        
        זהה:
        1. פריטים בסיסיים שנגמרו או עומדים להיגמר
        2. פריטים שכדאי לקנות לפי דפוסי צריכה
        3. פריטים שכדאי להוסיף לרשימת הקניות
        
        השב בעברית בפורמט JSON עם רשימת המלצות.
      `;

      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  reason: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        insights.push({
          type: "shopping_suggestion",
          priority: "medium",
          title: `${aiResponse.suggestions.length} המלצות קניה חכמות`,
          description: `על בסיס הרגלי הצריכה שלך, מומלץ לקנות: ${aiResponse.suggestions.slice(0, 3).map(s => s.item).join(', ')}`,
          action_items: aiResponse.suggestions.map(s => ({
            label: `הוסף ${s.item}`,
            action: "add_to_shopping",
            data: { item_name: s.item, reason: s.reason }
          })),
          related_data: { suggestions: aiResponse.suggestions },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // 4. Bill Reminders
    if (settings.bill_reminders_enabled) {
      const upcomingBills = bills.filter(b => {
        if (b.is_paid || !b.due_date) return false;
        const dueDate = new Date(b.due_date);
        const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= settings.bill_reminder_days;
      });

      upcomingBills.forEach(bill => {
        const dueDate = new Date(bill.due_date);
        const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        
        insights.push({
          type: "bill_reminder",
          priority: daysUntilDue <= 2 ? "urgent" : "high",
          title: `חשבון ${bill.type} ב-₪${bill.amount}`,
          description: `יש לשלם עד ${dueDate.toLocaleDateString('he-IL')} (עוד ${daysUntilDue} ימים)`,
          action_items: [{
            label: "סמן כשולם",
            action: "mark_bill_paid",
            data: { bill_id: bill.id }
          }],
          related_data: { bill_id: bill.id, amount: bill.amount, due_date: bill.due_date },
          expires_at: bill.due_date
        });
      });
    }

    // 5. Repair Priority Analysis
    if (settings.repair_priority_alerts_enabled) {
      const urgentRepairs = repairs.filter(r => 
        r.status !== "completed" && (r.priority === "urgent" || r.priority === "high")
      );

      if (urgentRepairs.length > 0) {
        insights.push({
          type: "repair_priority",
          priority: "high",
          title: `${urgentRepairs.length} תיקונים דחופים ממתינים`,
          description: `תיקונים חשובים שדורשים טיפול: ${urgentRepairs.map(r => r.title).join(', ')}`,
          related_data: {
            repairs: urgentRepairs.map(r => ({ id: r.id, title: r.title, priority: r.priority }))
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // 6. Budget Warnings - Projects
    if (settings.budget_warnings_enabled) {
      const activeProjects = projects.filter(p => p.status !== "completed" && p.budget);
      const overBudgetProjects = activeProjects.filter(p => p.spent && p.spent > p.budget);
      const nearBudgetProjects = activeProjects.filter(p => 
        p.spent && p.budget && 
        p.spent <= p.budget && 
        (p.spent / p.budget) >= 0.9
      );

      if (overBudgetProjects.length > 0) {
        insights.push({
          type: "budget_warning",
          priority: "urgent",
          title: `${overBudgetProjects.length} פרויקטים חרגו מהתקציב`,
          description: `פרויקטים אלה חורגים מהתקציב: ${overBudgetProjects.map(p => `${p.title} (חריגה: ₪${(p.spent - p.budget).toLocaleString()})`).join(', ')}`,
          action_items: overBudgetProjects.map(p => ({
            label: `צפה ב-${p.title}`,
            action: "view_project",
            data: { project_id: p.id }
          })),
          related_data: {
            projects: overBudgetProjects.map(p => ({
              id: p.id,
              title: p.title,
              budget: p.budget,
              spent: p.spent,
              overage: p.spent - p.budget
            }))
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      if (nearBudgetProjects.length > 0) {
        insights.push({
          type: "budget_warning",
          priority: "high",
          title: `${nearBudgetProjects.length} פרויקטים קרובים לחריגה`,
          description: `פרויקטים אלה מתקרבים לגבול התקציב (90%+): ${nearBudgetProjects.map(p => p.title).join(', ')}`,
          related_data: {
            projects: nearBudgetProjects.map(p => ({
              id: p.id,
              title: p.title,
              budget: p.budget,
              spent: p.spent,
              percentage: Math.round((p.spent / p.budget) * 100)
            }))
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // 7. Family Budget Tracking
    if (settings.budget_warnings_enabled) {
      const currentMonth = today.toISOString().slice(0, 7);
      const currentBudget = budgets.find(b => b.month === currentMonth);

      if (currentBudget && currentBudget.categories) {
        const totalBudget = Object.values(currentBudget.categories).reduce((sum, val) => sum + (val || 0), 0);
        const totalSpent = Object.values(currentBudget.actual_spending || {}).reduce((sum, val) => sum + (val || 0), 0);
        
        if (totalBudget > 0) {
          const percentageUsed = (totalSpent / totalBudget) * 100;
          
          if (totalSpent > totalBudget) {
            insights.push({
              type: "budget_warning",
              priority: "urgent",
              title: `חריגה מהתקציב החודשי`,
              description: `חרגת מהתקציב החודשי ב-₪${(totalSpent - totalBudget).toLocaleString()}. סה"כ הוצאות: ₪${totalSpent.toLocaleString()} מתוך תקציב של ₪${totalBudget.toLocaleString()}`,
              related_data: {
                total_budget: totalBudget,
                total_spent: totalSpent,
                overage: totalSpent - totalBudget,
                percentage: percentageUsed
              },
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
          } else if (percentageUsed >= 90) {
            insights.push({
              type: "budget_warning",
              priority: "high",
              title: `התקציב החודשי מתקרב לסיום`,
              description: `השתמשת ב-${Math.round(percentageUsed)}% מהתקציב החודשי. נותרו ₪${(totalBudget - totalSpent).toLocaleString()}`,
              related_data: {
                total_budget: totalBudget,
                total_spent: totalSpent,
                remaining: totalBudget - totalSpent,
                percentage: percentageUsed
              },
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      }
    }

    // Save insights to database
    const createdInsights = [];
    for (const insight of insights) {
      const created = await base44.asServiceRole.entities.AIInsight.create(insight);
      createdInsights.push(created);
    }

    // Clean up old/expired insights
    const allInsights = await base44.asServiceRole.entities.AIInsight.list();
    const expiredInsights = allInsights.filter(i => {
      if (!i.expires_at) return false;
      return new Date(i.expires_at) < today;
    });

    for (const expired of expiredInsights) {
      await base44.asServiceRole.entities.AIInsight.delete(expired.id);
    }

    return Response.json({ 
      success: true, 
      insights_generated: createdInsights.length,
      insights: createdInsights
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});