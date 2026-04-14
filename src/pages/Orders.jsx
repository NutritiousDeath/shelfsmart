const generateOrder = async () => {
  setGenerating(true);
  const lowStock = products.filter(p =>
    p.quantity_on_hand <= p.min_stock_level && p.status !== "discontinued"
  );

  if (lowStock.length === 0) {
    alert("No products are currently low on stock!");
    setGenerating(false);
    return;
  }

  // TODO: Replace with Railway AI endpoint
  // For now, create a basic draft order grouped by supplier
  const grouped = {};
  lowStock.forEach(p => {
    const supplier = p.supplier || "General Supplier";
    if (!grouped[supplier]) grouped[supplier] = [];
    grouped[supplier].push({
      product_id: p.id,
      product_name: p.name,
      quantity: Math.max(p.min_stock_level * 2, 1),
      unit_cost: p.cost || 0,
    });
  });

  for (const [supplier, items] of Object.entries(grouped)) {
    const total = items.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0);
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    await OrderEntity.create({
      supplier,
      status: "draft",
      items,
      total_cost: total,
      expected_delivery: delivery.toISOString().split("T")[0],
      notes: "Auto-generated from low stock",
    });
  }

  setGenerating(false);
  loadData();
};
