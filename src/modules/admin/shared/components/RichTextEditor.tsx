"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Trash2,
  Heading1,
  Heading2,
  HelpCircle,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = "Write product description here...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editorRef.current && isMounted) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isMounted]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, arg: string = "") => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, arg);
      handleInput();
    }
  };

  const addLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      execCmd("createLink", url);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-1.5 animate-pulse">
        {label && <label className="block text-sm font-medium">{label}</label>}
        <div className="w-full h-44 bg-muted/30 border border-border rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="border border-border rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/30 border-b border-border p-1.5">
          <button
            type="button"
            onClick={() => execCmd("bold")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h1>")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer font-bold text-xs"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<h2>")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer font-bold text-xs"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("formatBlock", "<p>")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer text-xs font-semibold px-1"
            title="Paragraph"
          >
            P
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <button
            type="button"
            onClick={addLink}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("removeFormat")}
            className="p-1.5 hover:bg-muted hover:text-foreground text-muted-foreground rounded transition cursor-pointer"
            title="Clear Formatting"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>

        {/* Editing Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          className="p-4 min-h-[160px] max-h-[300px] overflow-y-auto focus:outline-none text-sm leading-relaxed prose prose-stone max-w-none break-words"
          style={{ outline: "none" }}
        />
      </div>
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a3a3a3;
          cursor: text;
        }
        [contenteditable] ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        [contenteditable] ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        [contenteditable] h1 {
          font-size: 1.25rem !important;
          font-weight: bold !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.25rem !important;
        }
        [contenteditable] h2 {
          font-size: 1.1rem !important;
          font-weight: bold !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.25rem !important;
        }
      `}</style>
    </div>
  );
}
