"use client";

import { useState } from "react";
import type { Question } from "@/types";

interface GridViewProps {
  questions: Question[];
  getConfidenceColor: (conf: string) => string;
}

function TruncatedText({ text, maxLen = 200 }: { text: string; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-gray-300 italic">—</span>;
  if (text.length <= maxLen) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : text.slice(0, maxLen) + " …"}
      <button onClick={() => setExpanded(!expanded)} className="text-blue-500 text-xs ml-1 hover:underline">
        {expanded ? "Show less" : "Show more"}
      </button>
    </span>
  );
}

function DeliveryBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  const colors: Record<string, string> = {
    OOB: "bg-blue-100 text-blue-700",
    CFG: "bg-purple-100 text-purple-700",
    Custom: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[label] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

export default function GridView({ questions, getConfidenceColor }: GridViewProps) {
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr className="border-b">
            <th className="text-left px-3 py-2 font-medium text-gray-500 w-10">#</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 w-36">Reference ↕</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 w-36">Topic ↕</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[300px]">BSB Requirement (Exact)</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[300px]">Response (Bullet)</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[300px]">Response (Paragraph)</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            const confColor = getConfidenceColor(q.confidence);
            const rowBg = q.confidence === "RED" ? "bg-red-50" : q.confidence === "YELLOW" ? "bg-yellow-50" : "";
            return (
              <tr key={q.ref} className={`border-b hover:bg-blue-50/50 ${rowBg}`}>
                <td className="px-3 py-3 text-gray-400">{q.number}</td>
                <td className="px-3 py-3">
                  <a href="#" className="text-blue-600 hover:underline font-medium">{q.ref}</a>
                  <div className="flex gap-1 mt-1">
                    <DeliveryBadge label="OOB" active={q.a_oob} />
                    <DeliveryBadge label="CFG" active={q.b_config} />
                    <DeliveryBadge label="Custom" active={q.c_custom} />
                  </div>
                  {q.strategic && <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1" title="Strategic Positioning" />}
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <div>{q.topic}</div>
                  <div className="flex gap-1 mt-1">
                    <DeliveryBadge label="OOB" active={q.a_oob} />
                    <DeliveryBadge label="CFG" active={q.b_config} />
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <TruncatedText text={q.requirement} />
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <TruncatedText text={q.bullet} />
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <TruncatedText text={q.paragraph} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
