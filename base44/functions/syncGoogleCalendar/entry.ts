import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { direction } = await req.json(); // 'import' or 'export'
    
    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    if (direction === 'import') {
      // Import events from Google Calendar
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }

      const data = await response.json();
      const googleEvents = data.items || [];

      // Get existing calendar events
      const existingEvents = await base44.asServiceRole.entities.CalendarEvent.list();
      
      let imported = 0;
      for (const gEvent of googleEvents) {
        // Check if already imported by googleEventId
        const alreadyExists = existingEvents.find(e => e.google_event_id === gEvent.id);
        if (alreadyExists) continue;

        // Create new event
        await base44.asServiceRole.entities.CalendarEvent.create({
          title: gEvent.summary || 'אירוע',
          description: gEvent.description || '',
          date: gEvent.start.dateTime ? gEvent.start.dateTime.split('T')[0] : gEvent.start.date,
          start_time: gEvent.start.dateTime ? gEvent.start.dateTime.split('T')[1].substring(0, 5) : null,
          end_time: gEvent.end.dateTime ? gEvent.end.dateTime.split('T')[1].substring(0, 5) : null,
          location: gEvent.location || '',
          type: 'other',
          google_event_id: gEvent.id
        });
        imported++;
      }

      return Response.json({ 
        success: true, 
        imported,
        message: `יובאו ${imported} אירועים מ-Google Calendar` 
      });

    } else if (direction === 'export') {
      // Export events to Google Calendar
      const events = await base44.asServiceRole.entities.CalendarEvent.list();
      const eventsToExport = events.filter(e => !e.google_event_id);

      let exported = 0;
      for (const event of eventsToExport) {
        const startDateTime = event.start_time 
          ? `${event.date}T${event.start_time}:00`
          : event.date;
        const endDateTime = event.end_time
          ? `${event.date}T${event.end_time}:00`
          : event.date;

        const googleEvent = {
          summary: event.title,
          description: event.description || '',
          location: event.location || '',
          start: event.start_time 
            ? { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' }
            : { date: event.date },
          end: event.end_time
            ? { dateTime: endDateTime, timeZone: 'Asia/Jerusalem' }
            : { date: event.date }
        };

        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(googleEvent)
          }
        );

        if (response.ok) {
          const createdEvent = await response.json();
          // Update local event with Google event ID
          await base44.asServiceRole.entities.CalendarEvent.update(event.id, {
            google_event_id: createdEvent.id
          });
          exported++;
        }
      }

      return Response.json({ 
        success: true, 
        exported,
        message: `יוצאו ${exported} אירועים ל-Google Calendar` 
      });
    }

    return Response.json({ error: 'Invalid direction' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});