import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import { useCallback, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rte-toolbar-btn${active ? " active" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor losing focus
        onClick();
      }}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, disabled, autoFocus }: Props) {
  const lastValueRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      CodeBlock,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor: e }) {
      const html = e.getHTML();
      lastValueRef.current = html;
      onChange(html);
    },
  });

  // Sync external value changes (e.g. when entry changes in edit mode)
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValueRef.current) {
      editor.commands.setContent(value);
      lastValueRef.current = value;
    }
  }, [editor, value]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && editor) {
      setTimeout(() => editor.commands.focus("end"), 30);
    }
  }, [autoFocus, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL:", prev ?? "https://");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const empty =
    editor.isEmpty ||
    editor.getHTML() === "<p></p>";

  return (
    <div className={`rte-wrapper${disabled ? " rte-disabled" : ""}`}>
      <div className="rte-toolbar">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <u>U</u>
        </ToolbarButton>

        <span className="rte-sep" />

        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          &#8226;&#8212;
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
          1&#8212;
        </ToolbarButton>

        <span className="rte-sep" />

        <ToolbarButton active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          {"<>"}
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          {"{ }"}
        </ToolbarButton>

        <span className="rte-sep" />

        <ToolbarButton active={editor.isActive("link")} onClick={addLink} title="Hyperlink">
          &#128279;
        </ToolbarButton>
      </div>

      <div className="rte-editor-area" style={{ position: "relative" }}>
        {empty && placeholder && !disabled && (
          <span className="rte-placeholder">{placeholder}</span>
        )}
        <EditorContent editor={editor} className="rte-content" />
      </div>
    </div>
  );
}
