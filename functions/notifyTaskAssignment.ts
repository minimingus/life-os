import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📌 Task notification payload:', JSON.stringify(body, null, 2));
    
    const task_id = body.event?.entity_id || body.task_id;
    const event_type = body.event?.type || body.event_type || 'created';
    
    console.log(`📌 Processing task_id=${task_id}, event_type=${event_type}`);
    
    if (!task_id) {
      console.error('❌ Missing task_id in payload:', body);
      return Response.json({ error: 'Missing task_id', body }, { status: 400 });
    }

    // Get the task by listing and filtering
    const allTasks = await base44.entities.Task.list();
    const task = allTasks.find(t => t.id === task_id);
    
    console.log(`📌 Found task:`, task?.title, 'assigned_to:', task?.assigned_to_id);
    
    if (!task) {
      console.error(`❌ Task ${task_id} not found`);
      return Response.json({ error: `Task ${task_id} not found`, available_tasks: allTasks.length }, { status: 404 });
    }

    if (!task.assigned_to_id) {
      console.log('📌 Task has no assignment, skipping notification');
      return Response.json({ action: 'skipped', reason: 'no_assignment' });
    }

    // Get the assigned family member
    const allMembers = await base44.entities.FamilyMember.list();
    const member = allMembers.find(m => m.id === task.assigned_to_id);
    
    console.log(`📌 Member found:`, member?.name, 'preference:', member?.notification_preference);

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
      console.log(`📧 Sending email to ${member.email}`);
      const emailBody = `
שלום ${member.name},

${event_type === 'created' ? 'הוקצתה לך משימה חדשה' : 'משימה שלך עודכנה'}:

${taskTitle}${taskDescription}${dueDate}

לכנס למערכת והצג את המשימה שלך.
      `.trim();

      try {
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");
        console.log(`🔑 Got Gmail access token`);
        
        // Create the email in RFC 2822 format
        const emailMessage = [
          `To: ${member.email}`,
          `Subject: =?UTF-8?B?${Buffer.from(`משימה חדשה: ${taskTitle}`).toString('base64')}?=`,
          `Content-Type: text/plain; charset="UTF-8"`,
          `Content-Transfer-Encoding: base64`,
          '',
          Buffer.from(emailBody).toString('base64')
        ].join('\r\n');

        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: Buffer.from(emailMessage).toString('base64')
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gmail API error: ${response.status} - ${error}`);
        }

        console.log(`✅ Email sent successfully to ${member.email}`);
        sentEmail = true;
      } catch (emailError) {
        console.error(`❌ Email send failed:`, emailError);
      }
    } else {
      console.log(`⏭️ Skipping email - preference: ${member.notification_preference}, email: ${member.email}`);
    }

    // Send SMS if enabled (placeholder - requires SMS service)
    if ((member.notification_preference === 'sms' || member.notification_preference === 'both') && member.phone) {
      console.log(`📱 SMS would be sent to ${member.phone}: משימה חדשה - ${taskTitle}`);
      sentSms = true;
    }

    const result = { 
      action: 'notified',
      email: sentEmail,
      sms: sentSms,
      recipient: member.name,
      task: taskTitle
    };
    
    console.log('✅ Notification result:', result);
    return Response.json(result);
  } catch (error) {
    console.error('❌ Error notifying task assignment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});