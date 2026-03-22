'use client';

import { useState } from 'react';
import type { Question, FeedbackItem } from '@/types';

interface FeedbackPanelProps {
  question: Question;
  feedbackItems: FeedbackItem[];
  onAddFeedback: (ref: string, field: string, comment: string) => void;
  onResolveFeedback: (ref: string, timestamp: number) => void;
}

export default function FeedbackPanel({
  question,
  feedbackItems,
  onAddFeedback,
  onResolveFeedback,
}: FeedbackPanelProps) {
  const [field, setField] = useState('bullet');
  const [comment, setComment] = useState('');

  const myFeedback = feedbackItems.filter((f) => f.ref === question.ref);
  const unresolvedCount = myFeedback.filter((f) => !f.resolved).length;

  const submit = () => {
    if (!comment.trim()) return;
    onAddFeedback(question.ref, field, comment.trim());
    setComment('');
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Feedback{' '}
        {unresolvedCount > 0 && (
          <span className="text-orange-500 text-xs ml-1">({unresolvedCount} open)</span>
        )}
      </h3>

      {myFeedback.length > 0 && (
        <div className="space-y-2 mb-4">
          {myFeedback.map((f) => (
            <div
              key={f.timestamp}
              className={`border rounded p-3 text-sm ${f.resolved ? 'bg-gray-50 opacity-60' : 'bg-yellow-50 border-yellow-200'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase">{f.field}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(f.timestamp).toLocaleString()}
                  </span>
                  {!f.resolved && (
                    <button
                      onClick={() => onResolveFeedback(f.ref, f.timestamp)}
                      className="text-xs text-green-600 hover:underline"
                    >
                      resolve
                    </button>
                  )}
                  {f.resolved && <span className="text-xs text-green-600">resolved</span>}
                </div>
              </div>
              <p className="text-gray-700">{f.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-full"
        >
          <option value="bullet">Response (Bullet)</option>
          <option value="paragraph">Response (Paragraph)</option>
          <option value="requirement">Requirement</option>
          <option value="rationale">Rationale</option>
          <option value="general">General</option>
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add feedback or direction for this response..."
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          onClick={submit}
          className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-600 w-full"
        >
          Add Feedback
        </button>
      </div>
    </div>
  );
}
