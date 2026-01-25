import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // קבלת כל המשימות הפעילות
        const tasks = await base44.asServiceRole.entities.Task.filter({
            status: { $in: ['pending', 'in_progress'] }
        });

        // קבלת כל הגדרות התראות
        const allSettings = await base44.asServiceRole.entities.TaskNotificationSettings.list();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const notifications = [];

        for (const task of tasks) {
            if (!task.assigned_to_id || !task.due_date) continue;

            // מציאת הגדרות התראות של האחראי
            const settings = allSettings.find(s => s.family_member_id === task.assigned_to_id);
            
            if (!settings || !settings.enabled) continue;

            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            
            const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

            let shouldNotify = false;
            let notificationMessage = '';
            let notificationType = '';

            // בדיקת משימות באיחור
            if (daysUntilDue < 0 && settings.notify_overdue) {
                shouldNotify = true;
                notificationMessage = `המשימה "${task.title}" באיחור של ${Math.abs(daysUntilDue)} ימים!`;
                notificationType = 'overdue';
            }
            // בדיקת תזכורות לפני תאריך יעד
            else if (settings.days_before_due.includes(daysUntilDue)) {
                shouldNotify = true;
                if (daysUntilDue === 0) {
                    notificationMessage = `המשימה "${task.title}" צריכה להסתיים היום!`;
                } else if (daysUntilDue === 1) {
                    notificationMessage = `המשימה "${task.title}" צריכה להסתיים מחר`;
                } else {
                    notificationMessage = `המשימה "${task.title}" צריכה להסתיים בעוד ${daysUntilDue} ימים`;
                }
                notificationType = 'upcoming';
            }

            if (shouldNotify) {
                // קבלת פרטי בן המשפחה
                const member = await base44.asServiceRole.entities.FamilyMember.get(task.assigned_to_id);

                // שליחת התראה במייל אם מוגדר
                if (settings.notification_channels.includes('email') && member.email) {
                    try {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: member.email,
                            subject: notificationType === 'overdue' ? '⚠️ משימה באיחור' : '📋 תזכורת למשימה',
                            body: `
                                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                                    <h2 style="color: ${notificationType === 'overdue' ? '#ef4444' : '#3b82f6'};">
                                        ${notificationMessage}
                                    </h2>
                                    ${task.description ? `<p><strong>תיאור:</strong> ${task.description}</p>` : ''}
                                    <p><strong>תאריך יעד:</strong> ${new Date(task.due_date).toLocaleDateString('he-IL')}</p>
                                    <p><strong>עדיפות:</strong> ${task.priority === 'high' ? 'גבוהה' : task.priority === 'medium' ? 'בינונית' : 'נמוכה'}</p>
                                </div>
                            `
                        });
                    } catch (emailError) {
                        console.error('Error sending email:', emailError);
                    }
                }

                notifications.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    memberId: task.assigned_to_id,
                    memberName: task.assigned_to_name,
                    message: notificationMessage,
                    type: notificationType,
                    channels: settings.notification_channels
                });
            }
        }

        return Response.json({ 
            success: true, 
            notificationsSent: notifications.length,
            notifications 
        });

    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});