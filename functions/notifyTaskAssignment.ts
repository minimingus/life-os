import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const task_id = body.event?.entity_id || body.task_id;
    const event_type = body.event?.type || body.event_type || 'created';
    
    if (!task_id) {
      return Response.json({ error: 'Missing task_id', body }, { status: 400 });
    }

    // Get the task by listing and filtering (filter by id doesn't work reliably)
    const allTasks = await base44.entities.Task.list();
    const task = allTasks.find(t => t.id === task_id);
    
    if (!task) {
      return Response.json({ error: `Task ${task_id} not found`, available_tasks: allTasks.length }, { status: 404 });
    }

    if (!task.assigned_to_id) {
      return Response.json({ action: 'skipped', reason: 'no_assignment' });
    }

    // Get the assigned family member
    const allMembers = await base44.entities.FamilyMember.list();
    const member = allMembers.find(m => m.id === task.assigned_to_id);

    if (!member || member.notification_preference === 'none') {
      return Response.json({ action: 'skipped', reason: 'no_notification_enabled' });
    }

    let sentEmail = false;
    let sentSms = false;

    const taskTitle = task.title;
    const taskDescription = task.description ? `\n\nתיאור: ${task.description}` : '';
    const dueDate = task.due_date ? `\nתאריך סיום: ${task.due_date}` : '';

    // Send email if enabled
    if ((member.notification_preference === 'email' || member.notification_preference === 'both') && member.email) {
      const emailBody = `
שלום ${member.name},

${event_type === 'created' ? 'הוקצתה לך משימה חדשה' : 'משימה שלך עודכנה'}:

${taskTitle}${taskDescription}${dueDate}

לכנס למערכת והצג את המשימה שלך.
      `.trim();

      await base44.integrations.Core.SendEmail({
        to: member.email,
        subject: `משימה חדשה: ${taskTitle}`,
        body: emailBody
      });
      sentEmail = true;
    }

    // Send SMS if enabled (placeholder - requires SMS service)
    if ((member.notification_preference === 'sms' || member.notification_preference === 'both') && member.phone) {
      // Note: SMS integration would require an external SMS provider
      // For now, we'll log that it was attempted
      console.log(`SMS would be sent to ${member.phone}: משימה חדשה - ${taskTitle}`);
      sentSms = true;
    }

    return Response.json({ 
      action: 'notified',
      email: sentEmail,
      sms: sentSms,
      recipient: member.name
    });
  } catch (error) {
    console.error('Error notifying task assignment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});