import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

export interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlight?: string;
  fontSize?: string;
  fontFamily?: string;
}

export interface CustomElement {
  type: string;
  url?: string;
  children: CustomText[];
}

export type CustomEditor = BaseEditor & ReactEditor;
