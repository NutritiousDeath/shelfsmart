import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const allowedRoles = ['manager', 'admin', 'store_director', 'assistant_store_director'];
    if (!user || !allowedRoles.includes(user.role)) {
      return Response.json({ error: 'Manager access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'push';

    if (action === 'push') {
      // Push app events to Google Calendar
      const [orders, flashSales, products] = await Promise.all([
        base44.entities.Order.list(),
        base44.entities.FlashSale.list(),
        base44.entities.Product.list(),
      ]);

      const events = [];

      // Order delivery events
      for (const order of orders) {
        if (!order.expected_delivery || order.status === 'cancelled') continue;
        events.push({
          summary: `📦 Order Delivery: ${order.supplier}`,
          description: `PO Status: ${order.status}\nTotal: $${order.total_cost || 0}\nNotes: ${order.notes || ''}`,
          start: { date: order.expected_delivery },
          end: { date: order.expected_delivery },
          colorId: '7', // teal
        });
      }

      // Flash sale events
      for (const sale of flashSales) {
        if (!sale.start_date || !sale.end_date) continue;
        if (sale.status === 'ended') continue;
        events.push({
          summary: `⚡ Flash Sale: ${sale.product_name} (-${sale.discount_percent}%)`,
          description: `${sale.reason || ''}\nOriginal: $${sale.original_price} → Sale: $${sale.sale_price}\nStatus: ${sale.status}`,
          start: { date: sale.start_date },
          end: { date: sale.end_date },
          colorId: '5', // yellow
        });
      }

      // Expiring products (within 7 days)
      const today = new Date();
      for (const product of products) {
        if (!product.expiration_date) continue;
        const exp = new Date(product.expiration_date);
        const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 7) {
          events.push({
            summary: `🔴 Expires: ${product.name}`,
            description: `${daysLeft === 0 ? 'Expires TODAY' : `${daysLeft} day(s) left`}\nQuantity: ${product.quantity_on_hand}`,
            start: { date: product.expiration_date },
            end: { date: product.expiration_date },
            colorId: '11', // red
          });
        }
      }

      const results = [];
      for (const event of events) {
        const res = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          console.error('Failed to create event:', event.summary, data);
        }
        results.push({ title: event.summary, id: data.id, status: res.status, error: data.error });
      }

      return Response.json({ message: `Pushed ${results.length} events to Google Calendar`, results });
    }

    if (action === 'create') {
      // Create a custom event
      const { title, description, date, endDate } = body;
      const event = {
        summary: title,
        description: description || '',
        start: { date },
        end: { date: endDate || date },
        colorId: '3', // purple
      };
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
      const data = await res.json();
      return Response.json({ message: 'Event created', event: data });
    }

    if (action === 'list') {
      // Fetch upcoming Google Calendar events
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await res.json();
      return Response.json({ events: data.items || [] });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});