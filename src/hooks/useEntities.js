/**
 * useEntities.js
 * Drop-in Supabase replacements for all base44.entities.X calls in ShelfSmart.
 *
 * Usage:
 *   import { ProductEntity, OrderEntity, FlashSaleEntity, TeamMemberEntity } from '@/hooks/useEntities';
 *
 * Each entity exposes: list(orderCol?), filter(obj), create(data), update(id, data), delete(id)
 */

import { supabase } from '@/api/supabaseClient';

const makeEntity = (tableName) => ({
  /**
   * list(orderCol?)
   * orderCol: e.g. "-created_date" (minus prefix = descending) or "name"
   * Equivalent to: base44.entities.X.list("-created_date")
   */
  async list(orderCol = null) {
    let query = supabase.from(tableName).select('*');
    if (orderCol) {
      const descending = orderCol.startsWith('-');
      const col = descending ? orderCol.slice(1) : orderCol;
      query = query.order(col, { ascending: !descending });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * filter(obj)
   * Equivalent to: base44.entities.X.filter({ status: "active" })
   */
  async filter(filters = {}) {
    let query = supabase.from(tableName).select('*');
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * create(data)
   * Equivalent to: base44.entities.X.create({...})
   * Returns the created record.
   */
  async create(data) {
    const { data: created, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created;
  },

  /**
   * update(id, data)
   * Equivalent to: base44.entities.X.update(id, {...})
   */
  async update(id, data) {
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  /**
   * delete(id)
   * Equivalent to: base44.entities.X.delete(id)
   */
  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
});

// ── ShelfSmart Entities ───────────────────────────────────────────────────────
// Table names must match what you create in Supabase (see SQL schema below).

export const ProductEntity     = makeEntity('products');
export const OrderEntity       = makeEntity('orders');
export const FlashSaleEntity   = makeEntity('flash_sales');
export const TeamMemberEntity  = makeEntity('team_members');
