import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { taskId } = await req.json();

        // קבלת המשימה
        const task = await base44.asServiceRole.entities.Task.get(taskId);
        
        // בדיקה אם יש תאריך יעד ואחראי
        if (!task.due_date || !task.assigned_to_id) {
            return Response.json({ 
                success: false, 
                message: 'אין תאריך יעד או אחראי למשימה' 
            });
        }

        // קבלת פרטי בן המשפחה
        const member = await base44.asServiceRole.entities.FamilyMember.get(task.assigned_to_id);
        
        if (!member.email) {
            return Response.json({ 
                success: false, 
                message: 'לא הוגדר מייל לאחראי על המשימה' 
            });
        }

        // קבלת Access Token של Google Calendar
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

        // יצירת אירוע ב-Google Calendar
        const eventData = {
            summary: `📋 ${task.title}`,
            description: task.description || '',
            start: {
                date: task.due_date
            },
            end: {
                date: task.due_date
            },
            attendees: [
                { email: member.email }
            ],
            reminders: {
                useDefault: true
            }
        };

        const calendarResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            }
        );

        if (!calendarResponse.ok) {
            const error = await calendarResponse.text();
            throw new Error(`Google Calendar API error: ${error}`);
        }

        const event = await calendarResponse.json();

        return Response.json({ 
            success: true, 
            eventId: event.id,
            eventLink: event.htmlLink
        });

    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});