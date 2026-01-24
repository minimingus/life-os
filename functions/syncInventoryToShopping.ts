import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { differenceInDays, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inventory_item_id } = await req.json();
    
    if (!inventory_item_id) {
      return Response.json({ error: 'Missing inventory_item_id' }, { status: 400 });
    }

    // Get the inventory item
    const inventoryItems = await base44.entities.InventoryItem.filter({ id: inventory_item_id });
    const inventoryItem = inventoryItems[0];
    
    if (!inventoryItem) {
      return Response.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    // Check if it already exists in shopping list with this inventory_item_id
    const existingItems = await base44.entities.ShoppingItem.filter({
      inventory_item_id: inventory_item_id,
      is_purchased: false
    });

    let reason = null;
    let shouldAdd = false;

    // Check if out of stock
    if (inventoryItem.status === 'out_of_stock') {
      reason = 'out_of_stock';
      shouldAdd = true;
    }
    // Check if low stock
    else if (inventoryItem.status === 'low') {
      reason = 'low_stock';
      shouldAdd = true;
    }
    // Check if expiry is approaching
    else if (inventoryItem.expiry_date) {
      const expiryDate = parseISO(inventoryItem.expiry_date);
      const daysUntilExpiry = differenceInDays(expiryDate, new Date());
      
      // Get notification settings to determine alert days
      const settings = await base44.entities.NotificationSettings.list();
      const alertDays = settings[0]?.expiry_alert_days || 3;
      
      if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
        reason = 'expiry_warning';
        shouldAdd = true;
      }
    }

    // Find responsible family member
    let assignedToId = null;
    let assignedToName = null;

    if (shouldAdd) {
      const allMembers = await base44.entities.FamilyMember.list();
      const shopperMember = allMembers.find(m => 
        m.responsibilities && m.responsibilities.includes('קניות')
      );

      if (shopperMember) {
        assignedToId = shopperMember.id;
        assignedToName = shopperMember.name;
      }
    }

    // Update or create shopping item
    if (shouldAdd) {
      if (existingItems.length > 0) {
        // Update existing
        const existing = existingItems[0];
        await base44.entities.ShoppingItem.update(existing.id, {
          ...existing,
          quantity: inventoryItem.quantity || 1,
          reason,
          priority: inventoryItem.is_staple ? 'high' : 'medium',
          assigned_to_id: assignedToId,
          assigned_to_name: assignedToName
        });
        return Response.json({ action: 'updated', id: existing.id, assignedToId });
      } else {
        // Create new
        const newItem = await base44.entities.ShoppingItem.create({
          name: inventoryItem.name,
          category: inventoryItem.category,
          quantity: inventoryItem.quantity || 1,
          unit: inventoryItem.unit || 'units',
          priority: inventoryItem.is_staple ? 'high' : 'medium',
          inventory_item_id: inventory_item_id,
          reason,
          assigned_to_id: assignedToId,
          assigned_to_name: assignedToName,
          notes: `נוסף אוטומטית - ${
            reason === 'out_of_stock' ? 'נגמר במלאי' :
            reason === 'low_stock' ? 'מלאי נמוך' :
            'מתקרב לתאריך תפוגה'
          }`
        });
        return Response.json({ action: 'created', id: newItem.id, assignedToId });
      }
    } else {
      // If item is back in stock and has no warning, optionally remove from shopping list
      if (existingItems.length > 0 && inventoryItem.status === 'ok') {
        await base44.entities.ShoppingItem.delete(existingItems[0].id);
        return Response.json({ action: 'deleted', id: existingItems[0].id });
      }
    }

    return Response.json({ action: 'none' });
  } catch (error) {
    console.error('Error syncing inventory to shopping:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});