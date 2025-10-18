export type Trigger =
  | {
      isActive: true;
      start: number; // index of '@'
      end: number; // index of caret (exclusive)
      query: string; // substring after '@'
    }
  | { isActive: false };

type Options = { allowEmptyQuery?: boolean };

const USERNAME_CHAR_RX = /^[a-zA-Z0-9_]*$/;

function isNonBoundaryBeforeAt(ch: string | undefined) {
  return !!ch && /[a-zA-Z0-9_]/.test(ch);
}

export function getActiveAtTrigger(
  text: string,
  caret: number,
  opts: Options = { allowEmptyQuery: true }
): Trigger {
  if (!text || caret < 0 || caret > text.length) return { isActive: false };
  const atIndex = text.lastIndexOf("@", Math.max(0, caret - 1));
  if (atIndex < 0 || atIndex > caret) return { isActive: false };
  const prev = atIndex > 0 ? text[atIndex - 1] : undefined;
  if (isNonBoundaryBeforeAt(prev)) return { isActive: false };

  const query = text.slice(atIndex + 1, caret);
  if (!USERNAME_CHAR_RX.test(query)) return { isActive: false };
  if (!opts.allowEmptyQuery && query.length === 0) return { isActive: false };

  return { isActive: true, start: atIndex, end: caret, query };
}

export function applyMentionInsertion(
  text: string,
  trigger: Exclude<Trigger, { isActive: false }>,
  username: string
) {
  const cleanUsername = username.replace(/^@+/, "").toLowerCase();
  const mentionText = `@${cleanUsername}`;
  const before = text.slice(0, trigger.start);
  const after = text.slice(trigger.end);
  const needsSpace = after.length === 0 || !/^\s/.test(after);
  const inserted = needsSpace ? `${mentionText} ` : mentionText;
  const nextText = before + inserted + after;
  const nextCaret = (before + inserted).length;
  return { nextText, nextCaret };
}