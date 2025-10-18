import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { searchUsers, MentionUser } from "./mentionApi";
import { getActiveAtTrigger, applyMentionInsertion } from "./MentionCore";
import "./mentions.css";

export default function GlobalMentionLayer() {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [results, setResults] = useState<MentionUser[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [targetEl, setTargetEl] = useState<
    HTMLInputElement | HTMLTextAreaElement | HTMLElement | null
  >(null);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;

      if (
        el.tagName === "TEXTAREA" ||
        (el.tagName === "INPUT" && (el as HTMLInputElement).type === "text") ||
        el.isContentEditable
      ) {
        let caret = 0;
        let text = "";

        if ("value" in el) {
          const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
          caret = inputEl.selectionStart ?? inputEl.value.length;
          text = inputEl.value;
        } else {
          const editableEl = el as HTMLElement;
          caret = editableEl.innerText.length;
          text = editableEl.innerText;
        }

        const trig = getActiveAtTrigger(text, caret, { allowEmptyQuery: false });
        if (trig.isActive) {
          const q = trig.query;
          const list = q.trim().length ? await searchUsers(q) : [];
          setResults(list);
          setOpen(true);
          setActiveIdx(0);
          setTargetEl(el);

          const rect = el.getBoundingClientRect();
          setAnchor({
            x: rect.left + 20,
            y: rect.top + rect.height + window.scrollY,
          });
        } else {
          setOpen(false);
        }
      }
    };

    document.addEventListener("keyup", handler);
    return () => document.removeEventListener("keyup", handler);
  }, []);

  const choose = (user: MentionUser) => {
    if (!targetEl) return;

    let caret = 0;
    let text = "";

    if ("value" in targetEl) {
      const inputEl = targetEl as HTMLInputElement | HTMLTextAreaElement;
      caret = inputEl.selectionStart ?? 0;
      text = inputEl.value;
    } else {
      const editableEl = targetEl as HTMLElement;
      caret = editableEl.innerText.length;
      text = editableEl.innerText;
    }

    const trig = getActiveAtTrigger(text, caret, { allowEmptyQuery: false });
    if (!trig.isActive) return;

    const { nextText, nextCaret } = applyMentionInsertion(
      text,
      trig,
      user.username
    );

    if ("value" in targetEl) {
      const inputEl = targetEl as HTMLInputElement | HTMLTextAreaElement;
      inputEl.value = nextText;
      inputEl.selectionStart = inputEl.selectionEnd = nextCaret;
    } else {
      const editableEl = targetEl as HTMLElement;
      editableEl.innerText = nextText;
      // contentEditable में caret restore करना थोड़ा अलग होगा
    }

    targetEl.dispatchEvent(new Event("input", { bubbles: true }));
    setOpen(false);
  };

  if (!open || !anchor) return null;

  return createPortal(
    <div className="mention-layer" style={{ top: anchor.y, left: anchor.x }}>
      {results.length === 0 && <div className="mention-empty">No users</div>}
      {results.map((u, i) => (
        <div
          key={u._id}
          className={`mention-item ${i === activeIdx ? "active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            choose(u);
          }}
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="mention-avatar" />
          ) : (
            <div className="mention-avatar placeholder">
              {u.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="mention-info">
            <div className="mention-username">@{u.username}</div>
            {u.name && <div className="mention-name">{u.name}</div>}
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
