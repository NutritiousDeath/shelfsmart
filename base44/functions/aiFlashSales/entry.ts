import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  console.log("aiFlashSales hit");

  const base44 = createClientFromRequest(req);

  try {
    // Step 1 — Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const fourteenDaysStr = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Step 2 — Fetch all products
    const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 100);

    // Step 3 — Find overstock and expiring products
    const overstockedProducts = allProducts.filter(p =>
      p.quantity_on_hand > (p.min_stock_level * 3) &&
      p.status !== 'discontinued'
    );

    const expiringProducts = allProducts.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = p.expiration_date.split('T')[0];
      return expDate >= todayStr && expDate <= fourteenDaysStr && p.status !== 'discontinued';
    });

    console.log(`Found ${overstockedProducts.length} overstocked, ${expiringProducts.length} expiring within 14 days`);

    if (overstockedProducts.length === 0 && expiringProducts.length === 0) {
      return Response.json({
        success: true,
        message: "No flash sale candidates found at this time.",
        flash_sales_created: 0
      });
    }

    // Step 4 — Build summary for AI
    const productSummary = {
      overstocked: overstockedProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        quantity_on_hand: p.quantity_on_hand,
        min_stock_level: p.min_stock_level,
        retail_price: p.retail_price || 0,
        unit_cost: p.unit_cost || 0,
        location: p.location || 'Unknown',
        expiration_date: p.expiration_date || null
      })),
      expiring_soon: expiringProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        quantity_on_hand: p.quantity_on_hand,
        retail_price: p.retail_price || 0,
        unit_cost: p.unit_cost || 0,
        expiration_date: p.expiration_date,
        days_until_expiry: Math.ceil((new Date(p.expiration_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }))
    };

    // Step 5 — Ask AuraAI to generate flash sale recommendations
    const prompt = `You are AuraAI, an intelligent inventory management system for a retail store.

Analyze the following overstocked and expiring products and generate strategic flash sale recommendations to maximize revenue and minimize waste.

Today's date: ${todayStr}

Overstocked Products (more than 3x minimum stock level):
${JSON.stringify(productSummary.overstocked, null, 2)}

Products Expiring Within 14 Days:
${JSON.stringify(productSummary.expiring_soon, null, 2)}

For each product recommend:
1. A discount percentage (between 10% and 70%)
2. Sale duration in days
3. A compelling customer-facing reason for the sale
4. Priority (HIGH/MEDIUM/LOW)

Rules:
- Never recommend a sale price below unit cost
- Higher urgency for products expiring sooner
- Bigger discounts for more overstocked items
- Consider category when making recommendations

Respond ONLY in this exact JSON format with no other text:
{
  "summary": "Brief overall flash sale strategy summary",
  "recommendations": [
    {
      "product_id": "id here",
      "product_name": "name here",
      "original_price": 0,
      "recommended_discount_percent": 0,
      "recommended_sale_price": 0,
      "sale_duration_days": 0,
      "reason": "customer facing reason here",
      "internal_reason": "internal reason for staff here",
      "priority": "HIGH",
      "type": "OVERSTOCK or EXPIRING"
    }
  ]
}`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: false
    });

    // Step 6 — Parse AI response
    let aiResponse;
    try {
      const cleaned = llmResult.toString().replace(/```json|```/g, '').trim();
      aiResponse = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", e.message);
      return Response.json({
        success: false,
        error: "Failed to parse AI recommendations",
        raw: llmResult.toString()
      }, { status: 500 });
    }

    // Step 7 — Create FlashSale entries with suggested status
    const flashSalesCreated = [];
    for (const rec of aiResponse.recommendations) {
      if (rec.recommended_sale_price > 0) {
        try {
          const endDate = new Date(today.getTime() + rec.sale_duration_days * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

          const product = allProducts.find(p => p.id === rec.product_id);

          const flashSale = await base44.asServiceRole.entities.FlashSale.create({
            product_id: rec.product_id,
            product_name: rec.product_name,
            original_price: rec.original_price || product?.retail_price || 0,
            sale_price: rec.recommended_sale_price,
            discount_percent: rec.recommended_discount_percent,
            reason: rec.reason,
            expiration_date: product?.expiration_date || null,
            status: 'suggested',
            start_date: todayStr,
            end_date: endDate
          });

          flashSalesCreated.push({
            product_name: rec.product_name,
            flash_sale_id: flashSale.id,
            discount: rec.recommended_discount_percent,
            sale_price: rec.recommended_sale_price,
            priority: rec.priority,
            type: rec.type
          });

          console.log(`Created flash sale for: ${rec.product_name} at ${rec.recommended_discount_percent}% off`);
        } catch (e) {
          console.error(`Failed to create flash sale for ${rec.product_name}:`, e.message);
        }
      }
    }

    return Response.json({
      success: true,
      summary: aiResponse.summary,
      overstock_count: overstockedProducts.length,
      expiring_count: expiringProducts.length,
      flash_sales_created: flashSalesCreated.length,
      flash_sales: flashSalesCreated,
      recommendations: aiResponse.recommendations
    });

  } catch (err) {
    console.error("aiFlashSales error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});