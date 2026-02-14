import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Search for emails with common bill-related keywords
    const queries = [
      'subject:(חשבון OR חשבונית OR invoice OR bill)',
      'from:(electric.co.il OR water.co.il OR bezeq.co.il OR cellcom.co.il OR partner.co.il)'
    ];

    const foundBills = [];

    for (const query of queries) {
      const searchResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      const messages = searchData.messages || [];

      for (const message of messages) {
        // Get message details
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!msgResponse.ok) continue;

        const msgData = await msgResponse.json();
        const headers = msgData.payload.headers;

        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Extract bill information using AI
        const extractResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `נתח את הנושא הבא של מייל חשבונית וחלץ מידע:
נושא: "${subject}"
שולח: "${from}"

חלץ את המידע הבא (אם קיים):
1. סוג החשבון (חשמל, מים, אינטרנט, טלפון וכו')
2. סכום (אם מופיע)
3. תאריך לתשלום (אם מופיע)

אם לא מצאת מידע, החזר null לשדה זה.`,
          response_json_schema: {
            type: 'object',
            properties: {
              bill_type: { type: 'string' },
              amount: { type: 'number' },
              due_date: { type: 'string' },
              is_valid_bill: { type: 'boolean' }
            }
          }
        });

        if (extractResponse.is_valid_bill) {
          foundBills.push({
            email_id: message.id,
            subject,
            from,
            date,
            bill_type: extractResponse.bill_type,
            amount: extractResponse.amount,
            due_date: extractResponse.due_date
          });
        }
      }
    }

    // Check existing bills to avoid duplicates
    const existingBills = await base44.asServiceRole.entities.Bill.list();
    let imported = 0;

    for (const bill of foundBills) {
      // Check if already imported by email_id
      const alreadyExists = existingBills.find(b => b.email_id === bill.email_id);
      if (alreadyExists) continue;

      if (bill.amount && bill.due_date) {
        await base44.asServiceRole.entities.Bill.create({
          type: bill.bill_type || 'other',
          amount: bill.amount,
          due_date: bill.due_date,
          is_paid: false,
          notes: `יובא אוטומטית מהמייל: ${bill.subject}`,
          email_id: bill.email_id
        });
        imported++;
      }
    }

    return Response.json({ 
      success: true,
      found: foundBills.length,
      imported,
      message: `נמצאו ${foundBills.length} חשבוניות, יובאו ${imported} חדשות`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});