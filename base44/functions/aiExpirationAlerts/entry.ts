import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  console.log("aiExpirationAlerts hit");

  const base44 = createClientFromRequest(req);

  try {
    // Step 1 — Get today's date and calculate 7 day window
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    console.log(`Checking expirations between ${todayStr} and ${sevenDaysStr}`);

    // Step 2 — Fetch all products with expiration dates
    const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 100);

    const expiringProducts = allProducts.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = p.expiration_date.split('T')[0];
      return expDate >= todayStr && expDate <= sevenDaysStr && p.status !== 'discontinued';
    });

    const expiredProducts = allProducts.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = p.expiration_date.split('T')[0];
      return expDate < todayStr && p.status !== 'discontinued';
    });

    console.log(`Found ${expiringProducts.length} expiring soon, ${expiredProducts.length} already expired`);

    if (expiringProducts.length === 0 && expiredProducts.length === 0) {
      return Response.json({
        success: true,
        message: "No expiring or expired products found. All good!",
        alerts_created: 0
      });
    }

    // Step 3 — Build summary for AI
    const productSummary = {
      expiring_soon: expiringProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        quantity_on_hand: p.quantity_on_hand,
        expiration_date: p.expiration_date,
        retail_price: p.retail_price || 0,
        unit_cost: p.unit_cost || 0,
        location: p.location || 'Unknown',
        days_until_expiry: Math.ceil((new Date(p.expiration_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      })),
      already_expired: expiredProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        quantity_on_hand: p.quantity_on_hand,
        expiration_date: p.expiration_date,
        retail_price: p.retail_price || 0,
        location: p.location || 'Unknown'
      }))
    };

    // Step 4 — Ask AuraAI to generate alerts and recommendations
    const prompt = `You are AuraAI, an intelligent inventory management system for a retail store.

Analyze the following expiring and expired products and generate actionable alerts and recommendations.

Today's date: ${todayStr}

Products expiring within 7 days:
${JSON.stringify(productSummary.expiring_soon, null, 2)}

Already expired products:
${JSON.stringify(productSummary.already_expired, null, 2)}

For each expiring product recommend one of:
- FLASH_SALE: Suggest a discount percentage to move the product quickly
- MARKDOWN: Suggest a smaller price reduction
- REMOVE: If already expired, recommend immediate removal from shelves
- MONITOR: If expiring but quantity is low, just monitor

Respond ONLY in this exact JSON format with no other text:
{
  "summary": "Brief overall summary of the expiration situation",
  "alerts": [
    {
      "product_id": "id here",
      "product_name": "name here",
      "expiration_date": "date here",
      "days_until_expiry": 0,
      "quantity_on_hand": 0,
      "action": "FLASH_SALE",
      "urgency": "HIGH",
      "recommended_discount_percent": 0,
      "recommended_sale_price": 0,
      "reason": "reason here"
    }
  ]
}`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: false
    });

    // Step 5 — Parse AI response
    let aiResponse;
    try {
      const cleaned = llmResult.toString().replace(/```json|```/g, '').trim();
      aiResponse = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", e.message);
      return Response.json({
        success: false,
        error: "Failed to parse AI alerts",
        raw: llmResult.toString()
      }, { status: 500 });
    }

    // Step 6 — Auto-create FlashSale entries for FLASH_SALE recommendations
    const flashSalesCreated = [];
    for (const alert of aiResponse.alerts) {
      if (alert.action === 'FLASH_SALE' && alert.recommended_sale_price > 0) {
        try {
          const flashSale = await base44.asServiceRole.entities.FlashSale.create({
            product_id: alert.product_id,
            product_name: alert.product_name,
            original_price: allProducts.find(p => p.id === alert.product_id)?.retail_price || 0,
            sale_price: alert.recommended_sale_price,
            discount_percent: alert.recommended_discount_percent,
            reason: `AuraAI Expiration Alert: ${alert.reason}`,
            expiration_date: alert.expiration_date,
            status: 'suggested',
            start_date: todayStr,
            end_date: alert.expiration_date
          });
          flashSalesCreated.push({ product_name: alert.product_name, flash_sale_id: flashSale.id });
          console.log(`Created flash sale suggestion for: ${alert.product_name}`);
        } catch (e) {
          console.error(`Failed to create flash sale for ${alert.product_name}:`, e.message);
        }
      }
    }

    return Response.json({
      success: true,
      summary: aiResponse.summary,
      expiring_soon_count: expiringProducts.length,
      expired_count: expiredProducts.length,
      alerts: aiResponse.alerts,
      flash_sales_created: flashSalesCreated.length,
      flash_sales: flashSalesCreated
    });

  } catch (err) {
    console.error("aiExpirationAlerts error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});