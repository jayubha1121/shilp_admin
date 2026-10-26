'use client';

import { useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight: string;
};

const toolbar = [
  { label: 'Bold', icon: Bold, command: 'bold' },
  { label: 'Italic', icon: Italic, command: 'italic' },
  { label: 'Strikethrough', icon: Strikethrough, command: 'strikeThrough' },
  { label: 'Underline', icon: Underline, command: 'underline' },
  { label: 'Heading 1', icon: Heading1, command: 'formatBlock', value: 'h1' },
  { label: 'Heading 2', icon: Heading2, command: 'formatBlock', value: 'h2' },
  { label: 'Bulleted list', icon: List, command: 'insertUnorderedList' },
  { label: 'Numbered list', icon: ListOrdered, command: 'insertOrderedList' },
  { label: 'Quote', icon: Quote, command: 'formatBlock', value: 'blockquote' },
  { label: 'Code', icon: Code, command: 'formatBlock', value: 'pre' },
  { label: 'Align left', icon: AlignLeft, command: 'justifyLeft' },
  { label: 'Align center', icon: AlignCenter, command: 'justifyCenter' },
  { label: 'Align right', icon: AlignRight, command: 'justifyRight' },
  { label: 'Undo', icon: Undo2, command: 'undo' },
  { label: 'Redo', icon: Redo2, command: 'redo' },
  { label: 'Remove formatting', icon: RemoveFormatting, command: 'removeFormat' },
] as const;

export default function RichTextEditor({ id, value, onChange, placeholder, minHeight }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    if (command === 'createLink') {
      const url = window.prompt('Enter link URL');
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, commandValue);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  return (
    <div className="overflow-hidden rounded border border-slate-300 bg-white focus-within:border-blue-500">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2" role="toolbar" aria-label="Text formatting">
        {toolbar.map(({ label, icon: Icon, command, ...item }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command, 'value' in item ? item.value : undefined)}
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          aria-label="Insert link"
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-slate-900"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('createLink')}
        >
          <Link2 size={16} />
        </button>
      </div>
      <div
        id={id}
        ref={editorRef}
        role="textbox"
        aria-label={placeholder}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="rich-text-input px-3 py-3 text-sm text-slate-800 outline-none"
        style={{ minHeight }}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}
