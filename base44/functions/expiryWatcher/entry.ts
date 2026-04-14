import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    // Fetch all products with expiration dates
    const products = await base44.asServiceRole.entities.Product.list();
    const expiring = products.filter(p => {
      if (!p.expiration_date || !p.retail_price) return false;
      const exp = new Date(p.expiration_date);
      exp.setHours(0, 0, 0, 0);
      return exp <= in7Days && exp >= today && p.quantity_on_hand > 0;
    });

    if (expiring.length === 0) {
      return Response.json({ message: "No items expiring within 7 days.", added: 0 });
    }

    // Get existing flash sale candidates to avoid duplicates
    const existingSales = await base44.asServiceRole.entities.FlashSale.list();
    const existingProductIds = new Set(
      existingSales
        .filter(s => s.status === "suggested" || s.status === "active")
        .map(s => s.product_id)
    );

    let added = 0;
    const todayStr = today.toISOString().split("T")[0];

    for (const product of expiring) {
      // Skip if already has a pending/active flash sale
      if (existingProductIds.has(product.id)) continue;

      const daysLeft = Math.max(0, Math.ceil((new Date(product.expiration_date) - today) / (1000 * 60 * 60 * 24)));

      // Calculate discount: more aggressive the closer to expiry
      let discountPercent;
      if (daysLeft <= 1) discountPercent = 50;
      else if (daysLeft <= 2) discountPercent = 40;
      else if (daysLeft <= 3) discountPercent = 35;
      else if (daysLeft <= 5) discountPercent = 25;
      else discountPercent = 15;

      const salePrice = +(product.retail_price * (1 - discountPercent / 100)).toFixed(2);

      // End date = day before expiry
      const endDate = new Date(product.expiration_date);
      endDate.setDate(endDate.getDate() - 1);
      const endDateStr = endDate.toISOString().split("T")[0];

      const reasons = {
        1: `⚡ Expires TOMORROW — ${discountPercent}% off to move stock fast!`,
        2: `🔥 Expires in 2 days — grab it at ${discountPercent}% off!`,
        3: `⏰ Expiring in 3 days — ${discountPercent}% flash discount applied`,
        5: `📢 Expires in ${daysLeft} days — ${discountPercent}% off while supplies last`,
      };
      const reason = reasons[daysLeft] || `Auto-flagged: expires in ${daysLeft} days — ${discountPercent}% suggested discount`;

      await base44.asServiceRole.entities.FlashSale.create({
        product_id: product.id,
        product_name: product.name,
        original_price: product.retail_price,
        sale_price: salePrice,
        discount_percent: discountPercent,
        reason,
        expiration_date: product.expiration_date,
        status: "suggested",
        start_date: todayStr,
        end_date: endDateStr,
      });

      added++;
    }

    return Response.json({
      message: `Expiry check complete. ${added} new flash sale candidate(s) added.`,
      checked: expiring.length,
      added,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});