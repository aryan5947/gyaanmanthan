import React from "react";

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
};

const emojis = ["😀","😁","😂","🤣","😃","😅","😉","😊","😍","😘","😎","🤩","🥳","😜"];

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="emoji-picker">
      {emojis.map((emoji, i) =>
        <span key={i} style={{fontSize: '2rem', cursor: 'pointer', margin: 4}} onClick={() => onSelect(emoji)}>
          {emoji}
        </span>
      )}
    </div>
  );
}