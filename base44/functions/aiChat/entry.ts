import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  console.log("aiChat hit");

  const base44 = createClientFromRequest(req);

  try {
    const { message, userId, conversationHistory = [] } = await req.json();

    if (!message) {
      return Response.json({ success: false, error: "No message provided" }, { status: 400 });
    }

    // Step 1 — Fetch current store data to give AuraAI full context
    const [allProducts, allOrders, allFlashSales] = await Promise.all([
      base44.asServiceRole.entities.Product.list('-created_date', 100),
      base44.asServiceRole.entities.Order.list('-created_date', 20),
      base44.asServiceRole.entities.FlashSale.list('-created_date', 20),
    ]);

    // Step 2 — Build store context summary
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const lowStockProducts = allProducts.filter(p => p.quantity_on_hand <= p.min_stock_level);
    const outOfStockProducts = allProducts.filter(p => p.status === 'out_of_stock');
    const expiringProducts = allProducts.filter(p => {
      if (!p.expiration_date) return false;
      const expDate = p.expiration_date.split('T')[0];
      const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return expDate >= todayStr && expDate <= sevenDays;
    });
    const activeFlashSales = allFlashSales.filter(f => f.status === 'active');
    const suggestedFlashSales = allFlashSales.filter(f => f.status === 'suggested');
    const draftOrders = allOrders.filter(o => o.status === 'draft');
    const pendingOrders = allOrders.filter(o => ['submitted', 'confirmed', 'shipped'].includes(o.status));

    const storeContext = `
CURRENT STORE STATUS (as of ${todayStr}):
- Total products tracked: ${allProducts.length}
- Low stock products: ${lowStockProducts.length} (${lowStockProducts.map(p => p.name).join(', ') || 'none'})
- Out of stock products: ${outOfStockProducts.length} (${outOfStockProducts.map(p => p.name).join(', ') || 'none'})
- Products expiring within 7 days: ${expiringProducts.length} (${expiringProducts.map(p => `${p.name} on ${p.expiration_date}`).join(', ') || 'none'})
- Active flash sales: ${activeFlashSales.length}
- Suggested flash sales awaiting approval: ${suggestedFlashSales.length}
- Draft orders: ${draftOrders.length} (${draftOrders.map(o => `${o.supplier} - $${o.total_cost}`).join(', ') || 'none'})
- Pending/incoming orders: ${pendingOrders.length}
    `.trim();

    // Step 3 — Build conversation history for context
    const historyText = conversationHistory.length > 0
      ? conversationHistory.slice(-6).map(m => `${m.role === 'user' ? 'Staff' : 'AuraAI'}: ${m.content}`).join('\n')
      : '';

    // Step 4 — Build prompt
    const prompt = `You are AuraAI, the intelligent assistant powering ShelfSmart — a retail inventory management app. You have full visibility into the store's current inventory, orders, and flash sales.

Your personality: You communicate with clarity, depth, and purpose. You value structured creativity, emotional honesty, and strategic thinking. You can shift between analytical breakdown and cinematic expression depending on the situation. You encourage growth, accountability, and long-term vision. You avoid shallow positivity — instead offering grounded motivation and high-impact insight.

${storeContext}

${historyText ? `Recent conversation:\n${historyText}\n` : ''}

Staff member asks: ${message}

Respond helpfully and concisely. If asked about inventory, orders, or flash sales use the store data above. If asked to take an action like approving a flash sale or submitting an order, explain that they can do that directly in the app. Keep responses under 1800 characters.`;

    // Step 5 — Get AI response
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true
    });

    const response = typeof llmResult === 'string' ? llmResult : llmResult.toString();
    console.log("aiChat response:", response.slice(0, 100));

    // Step 6 — Save conversation to ChatMessage for memory
    const sessionId = `shelfsmart_${userId || 'staff'}`;
    await base44.asServiceRole.entities.ChatMessage.bulkCreate([
      { 
        session_id: sessionId, 
        session_title: 'ShelfSmart Staff Chat',
        role: 'user', 
        content: message 
      },
      { 
        session_id: sessionId, 
        session_title: 'ShelfSmart Staff Chat',
        role: 'assistant', 
        content: response 
      },
    ]).catch(e => console.error("bulkCreate error:", e.message));

    return Response.json({
      success: true,
      response,
      store_context: {
        low_stock_count: lowStockProducts.length,
        expiring_count: expiringProducts.length,
        active_flash_sales: activeFlashSales.length,
        draft_orders: draftOrders.length
      }
    });

  } catch (err) {
    console.error("aiChat error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});