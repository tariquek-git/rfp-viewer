"use client";

import { useState } from "react";
import { Plus, Trash2, DollarSign } from "lucide-react";
import type { PricingModel, PricingLineItem } from "@/types";

interface PricingViewProps {
  pricing: PricingModel;
  onUpdate: (p: PricingModel) => void;
}

const CATEGORIES = ["Implementation", "Platform", "Processing", "Support", "Integration", "Compliance", "Other"];
const TYPES: PricingLineItem["type"][] = ["one-time", "recurring", "per-transaction", "volume-tiered"];

export default function PricingView({ pricing, onUpdate }: PricingViewProps) {
  const [newItem, setNewItem] = useState<Partial<PricingLineItem>>({ category: "Platform", type: "recurring", amount: 0, unit: "per month" });

  const addItem = () => {
    if (!newItem.description) return;
    const item: PricingLineItem = {
      id: Date.now().toString(),
      category: newItem.category || "Other",
      description: newItem.description || "",
      type: newItem.type || "recurring",
      amount: newItem.amount || 0,
      unit: newItem.unit || "",
      notes: newItem.notes || "",
    };
    onUpdate({ ...pricing, lineItems: [...pricing.lineItems, item], lastUpdated: Date.now() });
    setNewItem({ category: "Platform", type: "recurring", amount: 0, unit: "per month" });
  };

  const removeItem = (id: string) => {
    onUpdate({ ...pricing, lineItems: pricing.lineItems.filter(i => i.id !== id), lastUpdated: Date.now() });
  };

  const updateItem = (id: string, field: keyof PricingLineItem, value: string | number) => {
    onUpdate({
      ...pricing,
      lineItems: pricing.lineItems.map(i => i.id === id ? { ...i, [field]: value } : i),
      lastUpdated: Date.now(),
    });
  };

  const totalOneTime = pricing.lineItems.filter(i => i.type === "one-time").reduce((s, i) => s + i.amount, 0);
  const totalRecurring = pricing.lineItems.filter(i => i.type === "recurring").reduce((s, i) => s + i.amount, 0);
  const totalPerTx = pricing.lineItems.filter(i => i.type === "per-transaction").reduce((s, i) => s + i.amount, 0);
  const tco3yr = totalOneTime + (totalRecurring * 36);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = pricing.lineItems.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, PricingLineItem[]>);

  return (
    <div className="overflow-auto h-full p-6 bg-gray-50/30 dark:bg-gray-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Pricing Model</h2>
              <p className="text-xs text-gray-400">Structured cost breakdown for BSB procurement evaluation</p>
            </div>
          </div>
        </div>

        {/* TCO Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Implementation (One-time)", value: totalOneTime, color: "text-blue-600" },
            { label: "Monthly Recurring", value: totalRecurring, color: "text-emerald-600" },
            { label: "Per Transaction", value: totalPerTx, color: "text-violet-600", suffix: "/tx" },
            { label: "3-Year TCO (est.)", value: tco3yr, color: "text-gray-900 dark:text-white" },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className={`text-2xl font-bold ${card.color}`}>
                ${card.value.toLocaleString()}{card.suffix || ""}
              </div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Line Items by Category */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{cat}</h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-28">Type</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-28">Amount</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-24">Unit</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(item => (
                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-2">
                        <input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)}
                          className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={item.type} onChange={e => updateItem(item.id, "type", e.target.value)}
                          className="bg-transparent border-0 text-xs focus:outline-none">
                          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" value={item.amount} onChange={e => updateItem(item.id, "amount", Number(e.target.value))}
                          className="w-full bg-transparent border-0 focus:outline-none text-sm text-right font-mono" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)}
                          className="w-full bg-transparent border-0 focus:outline-none text-xs text-gray-500" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={item.notes} onChange={e => updateItem(item.id, "notes", e.target.value)}
                          className="w-full bg-transparent border-0 focus:outline-none text-xs text-gray-400" placeholder="..." />
                      </td>
                      <td className="px-2">
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Add new line item */}
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Add Line Item</h4>
          <div className="grid grid-cols-6 gap-2">
            <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Description" value={newItem.description || ""} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs col-span-2" />
            <input type="number" placeholder="Amount" value={newItem.amount || ""} onChange={e => setNewItem({ ...newItem, amount: Number(e.target.value) })}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs" />
            <input placeholder="Unit" value={newItem.unit || ""} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs" />
            <button onClick={addItem} disabled={!newItem.description}
              className="flex items-center justify-center gap-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-40">
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
