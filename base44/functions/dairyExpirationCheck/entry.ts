import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  console.log("dairyExpirationCheck hit");

  const base44 = createClientFromRequest(req);

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const fourteenDaysStr = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all dairy and cheese products
    const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 500);
    
    const dairyCategories = ['dairy', 'cheese'];
    const dairySubcategories = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'];

    const dairyProducts = allProducts.filter(p => {
      const category = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      return dairyCategories.some(c => category.includes(c)) ||
             dairySubcategories.some(s => name.includes(s) || notes.includes(s));
    });

    // Categorize by expiration urgency
    const expiredProducts = dairyProducts.filter(p => {
      if (!p.expiration_date) return false;
      return p.expiration_date.split('T')[0] < todayStr;
    });

    const criticalProducts = dairyProducts.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = p.expiration_date.split('T')[0];
      const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return expDate >= todayStr && expDate <= threeDays;
    });

    const warningProducts = dairyProducts.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = p.expiration_date.split('T')[0];
      const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return expDate > threeDays && expDate <= fourteenDaysStr;
    });

    const lowStockProducts = dairyProducts.filter(p =>
      p.quantity_on_hand <= p.min_stock_level &&
      p.status !== 'discontinued'
    );

    // Group by subcategory
    const subcategoryGroups = {
      milk: dairyProducts.filter(p => (p.name || '').toLowerCase().includes('milk')),
      cheese: dairyProducts.filter(p => (p.name || '').toLowerCase().includes('cheese') || (p.category || '').toLowerCase().includes('cheese')),
      yogurt: dairyProducts.filter(p => (p.name || '').toLowerCase().includes('yogurt')),
      butter: dairyProducts.filter(p => (p.name || '').toLowerCase().includes('butter')),
      cream: dairyProducts.filter(p => (p.name || '').toLowerCase().includes('cream')),
      eggs: dairyProducts.filter(p => (p.name || '').toLowerCase().includes('egg')),
    };

    // Get AI recommendations if there are issues
    let aiRecommendations = '';
    if (expiredProducts.length > 0 || criticalProducts.length > 0 || lowStockProducts.length > 0) {
      const prompt = `You are AuraAI managing dairy inventory for a retail store.

TODAY: ${todayStr}

DAIRY INVENTORY STATUS:
- Expired products (REMOVE IMMEDIATELY): ${expiredProducts.map(p => `${p.name} (expired ${p.expiration_date})`).join(', ') || 'None'}
- Critical — expiring within 3 days: ${criticalProducts.map(p => `${p.name} (expires ${p.expiration_date}, qty: ${p.quantity_on_hand})`).join(', ') || 'None'}
- Warning — expiring within 14 days: ${warningProducts.map(p => `${p.name} (expires ${p.expiration_date}, qty: ${p.quantity_on_hand})`).join(', ') || 'None'}
- Low stock: ${lowStockProducts.map(p => `${p.name} (qty: ${p.quantity_on_hand}/${p.min_stock_level})`).join(', ') || 'None'}

Provide 3-5 specific, actionable recommendations for the store manager. Be direct and prioritize by urgency. Keep under 600 characters.`;

      try {
        const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          model: 'gemini_3_flash',
          add_context_from_internet: false
        });
        aiRecommendations = typeof llmResult === 'string' ? llmResult : llmResult.toString();
      } catch (e) {
        console.error("AI recommendations error:", e.message);
      }
    }

    return Response.json({
      success: true,
      today: todayStr,
      summary: {
        total_dairy_products: dairyProducts.length,
        expired_count: expiredProducts.length,
        critical_count: criticalProducts.length,
        warning_count: warningProducts.length,
        low_stock_count: lowStockProducts.length,
        needs_attention: expiredProducts.length + criticalProducts.length + lowStockProducts.length
      },
      expired: expiredProducts.map(p => ({
        id: p.id,
        name: p.name,
        expiration_date: p.expiration_date,
        quantity_on_hand: p.quantity_on_hand,
        location: p.location,
        category: p.category,
        urgency: 'EXPIRED'
      })),
      critical: criticalProducts.map(p => ({
        id: p.id,
        name: p.name,
        expiration_date: p.expiration_date,
        quantity_on_hand: p.quantity_on_hand,
        location: p.location,
        category: p.category,
        days_until_expiry: Math.ceil((new Date(p.expiration_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        urgency: 'CRITICAL'
      })),
      warning: warningProducts.map(p => ({
        id: p.id,
        name: p.name,
        expiration_date: p.expiration_date,
        quantity_on_hand: p.quantity_on_hand,
        location: p.location,
        category: p.category,
        days_until_expiry: Math.ceil((new Date(p.expiration_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        urgency: 'WARNING'
      })),
      low_stock: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        quantity_on_hand: p.quantity_on_hand,
        min_stock_level: p.min_stock_level,
        supplier: p.supplier,
        location: p.location,
        urgency: 'LOW_STOCK'
      })),
      subcategories: {
        milk: { count: subcategoryGroups.milk.length, products: subcategoryGroups.milk },
        cheese: { count: subcategoryGroups.cheese.length, products: subcategoryGroups.cheese },
        yogurt: { count: subcategoryGroups.yogurt.length, products: subcategoryGroups.yogurt },
        butter: { count: subcategoryGroups.butter.length, products: subcategoryGroups.butter },
        cream: { count: subcategoryGroups.cream.length, products: subcategoryGroups.cream },
        eggs: { count: subcategoryGroups.eggs.length, products: subcategoryGroups.eggs },
      },
      ai_recommendations: aiRecommendations,
      all_dairy: dairyProducts
    });

  } catch (err) {
    console.error("dairyExpirationCheck error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});