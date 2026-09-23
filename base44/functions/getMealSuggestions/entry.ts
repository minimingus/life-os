import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available inventory items
    const inventory = await base44.entities.InventoryItem.list();
    const availableItems = inventory
      .filter(item => item.quantity > 0 && item.status !== 'expired')
      .map(item => `${item.name} (${item.quantity} ${item.unit})`)
      .join(', ');

    if (!availableItems) {
      return Response.json({ 
        suggestions: [],
        message: "אין פריטים זמינים במלאי"
      });
    }

    // Get AI meal suggestions
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה שף ישראלי מקצועי. בהתבסס על המצרכים הבאים במלאי, המלץ על 3 מנות שאפשר להכין.
      
מצרכים זמינים: ${availableItems}

עבור כל מנה, ספק:
1. שם המנה
2. זמן הכנה (בדקות)
3. רמת קושי (קל/בינוני/מאתגר)
4. רשימת מצרכים נדרשים (רק מהזמינים)
5. הוראות הכנה קצרות (3-5 שלבים)

חשוב: השתמש רק במצרכים שיש במלאי. אם חסרים מצרכים בסיסיים כמו שמן/מלח/תבלינים, אפשר להניח שיש.`,
      response_json_schema: {
        type: "object",
        properties: {
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                prep_time: { type: "number" },
                difficulty: { type: "string" },
                ingredients: {
                  type: "array",
                  items: { type: "string" }
                },
                instructions: {
                  type: "array",
                  items: { type: "string" }
                },
                tips: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ 
      suggestions: response.meals || [],
      available_items: availableItems
    });

  } catch (error) {
    console.error("Error getting meal suggestions:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});