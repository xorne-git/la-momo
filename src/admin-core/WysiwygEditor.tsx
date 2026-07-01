import { useRef, useState, useEffect, useCallback, type KeyboardEvent, type ChangeEvent, type MouseEvent as ReactMouseEvent, type RefObject, type ClipboardEvent } from "react";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSave?: (html: string) => void;
  onClose?: () => void;
  resizable?: boolean;
  inline?: boolean;
  editableClassName?: string;
}

export default function WysiwygEditor({ value, onChange, onSave, onClose, resizable, inline, editableClassName }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [editorFontSize, setEditorFontSize] = useState("1rem");
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorBtnRef = useRef<HTMLButtonElement>(null);

  // Change font-size of selected text by delta (steps of 0.2rem, tracked via data-fs)
  const changeFontSize = useCallback((delta: number) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      // Try to find a span with data-fs covering the selection first
      let el: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
      while (el && el.nodeType === 3) el = el.parentElement;
      el = el?.closest?.("[data-fs]") || el;

      let targetEl: HTMLElement;
      if (el && el !== editorRef.current && el.hasAttribute?.("data-fs")) {
        const currentRem = parseFloat(el.getAttribute("data-fs") || "1");
        const newRem = Math.max(0.75, Math.min(Math.round((currentRem + delta) * 100) / 100, 2.5));
        el.style.fontSize = `${newRem}rem`;
        el.setAttribute("data-fs", String(newRem));
        targetEl = el;
      } else {
        const span = document.createElement("span");
        const parentSize = parseFloat(window.getComputedStyle(range.startContainer.parentElement || editorRef.current!).fontSize) / 16;
        const newRem = Math.max(0.75, Math.min(Math.round((parentSize + delta) * 100) / 100, 2.5));
        span.style.fontSize = `${newRem}rem`;
        span.setAttribute("data-fs", String(newRem));
        try { range.surroundContents(span); } catch {
          const f = range.extractContents();
          span.appendChild(f);
          range.insertNode(span);
        }
        targetEl = span;
      }
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(targetEl);
      sel.addRange(r);
      editorRef.current?.focus();
      return;
    }
    // No selection: zoom editor
    setEditorFontSize((s) => {
      const v = parseFloat(s) + delta;
      return `${Math.max(0.75, Math.min(Math.round(v * 100) / 100, 2.5))}rem`;
    });
  }, []);

  // Initialize content on mount only — preserve value reference for source toggle
  const savedValue = useRef(value);
  useEffect(() => {
    savedValue.current = value;
  }, [value]);
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Close color picker on click outside or source toggle
  useEffect(() => { setShowColorPicker(false); }, [showSource]);
  useEffect(() => {
    if (!showColorPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (colorBtnRef.current && !colorBtnRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => document.removeEventListener("click", handleClick);
  }, [showColorPicker]);

  // Restore content when switching back from source view to rich text
  useEffect(() => {
    if (!showSource && editorRef.current) {
      editorRef.current.innerHTML = savedValue.current;
    }
  }, [showSource]);

  const getHtml = () => editorRef.current?.innerHTML || "";

  const updateFormats = useCallback(() => {
    const formats: string[] = [];
    if (document.queryCommandState("bold")) formats.push("bold");
    if (document.queryCommandState("italic")) formats.push("italic");
    if (document.queryCommandState("underline")) formats.push("underline");
    if (document.queryCommandValue("formatBlock") === "h2") formats.push("h2");
    if (document.queryCommandValue("formatBlock") === "h3") formats.push("h3");
    if (document.queryCommandState("justifyLeft")) formats.push("justifyLeft");
    if (document.queryCommandState("justifyCenter")) formats.push("justifyCenter");
    if (document.queryCommandState("justifyRight")) formats.push("justifyRight");
    if (document.queryCommandState("justifyFull")) formats.push("justifyFull");
    setActiveFormats(formats);
  }, []);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateFormats();
  };

  // Wrap current selection in a div with text-align style (prevents global alignment)
  const setAlignSelection = useCallback((align: "left" | "center" | "right" | "justify") => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      // Find the block container (p, h1-6, div, li)
      let block: Node | null = range.commonAncestorContainer;
      while (block && block.nodeType === 3) block = block.parentElement;
      const blockEl: HTMLElement | null = (block as HTMLElement)?.closest?.("p, h1, h2, h3, h4, h5, h6, li, td, th") || block as HTMLElement;
      if (blockEl && blockEl !== editorRef.current && blockEl.closest?.("[contenteditable]")) {
        blockEl.style.textAlign = align;
      } else {
        // Fallback: wrap in a div
        const div = document.createElement("div");
        div.style.textAlign = align;
        try { range.surroundContents(div); } catch {
          const frag = range.extractContents();
          div.appendChild(frag);
          range.insertNode(div);
        }
      }
    } else {
      // No selection: apply to current block
      const node = sel?.anchorNode;
      let block: Node | null = node;
      while (block && block.nodeType === 3) block = block.parentElement;
      const blockEl2: HTMLElement | null = (block as HTMLElement)?.closest?.("p, h1, h2, h3, h4, h5, h6, li, td, th") || block as HTMLElement;
      if (blockEl2 && blockEl2 !== editorRef.current) {
        blockEl2.style.textAlign = align;
      }
    }
    onChange(getHtml());
    editorRef.current?.focus();
  }, []);

  // Insert a 2×2 table with inline controls using Lucide-style icons
  const insertTable = useCallback(() => {
    const iconAdd = (bg: string) =>
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="${bg}"/><path d="M7 10h6M10 7v6" stroke="#FBFBFA" stroke-width="2" stroke-linecap="round"/></svg>`;
    const iconMinus = (bg: string) =>
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="${bg}"/><path d="M7 10h6" stroke="#FBFBFA" stroke-width="2" stroke-linecap="round"/></svg>`;
    const iconDel =
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#FF0000"/><path d="M7 7l6 6M13 7l-6 6" stroke="#FBFBFA" stroke-width="2" stroke-linecap="round"/></svg>`;

    const btn = "display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border-radius:3px;padding:2px;transition:background 0.15s;";
    const btnHover = "outline:none;";

    const buildTable = (rows: number, cols: number) => {
      const t = document.createElement("table");
      t.style.cssText = "width:100%;border-collapse:collapse;border:1px solid #121313;";
      for (let r = 0; r < rows; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < cols; c++) {
          const cell = r === 0 ? document.createElement("th") : document.createElement("td");
          cell.contentEditable = "true";
          cell.innerHTML = "&nbsp;";
          cell.style.cssText = "border:1px solid #121313;padding:6px 10px;min-width:60px;min-height:1em;" + (r === 0 ? "font-weight:bold;background-color:#EAEAEA;" : "");
          tr.appendChild(cell);
        }
        t.appendChild(tr);
      }
      return t;
    };

    const container = document.createElement("div");
    container.style.cssText = "position:relative;margin-bottom:32px;";

    // Column controls — top-right
    const colCtrl = document.createElement("div");
    colCtrl.style.cssText = `position:absolute;top:-22px;right:0;display:flex;gap:2px;`;
    colCtrl.contentEditable = "false";
    const addCol = document.createElement("button");
    addCol.innerHTML = iconAdd("#D16436");
    addCol.style.cssText = btn + btnHover;
    addCol.title = "Ajouter une colonne";
    const remCol = document.createElement("button");
    remCol.innerHTML = iconMinus("#8B1A1A");
    remCol.style.cssText = btn + btnHover;
    remCol.title = "Supprimer la dernière colonne";
    colCtrl.appendChild(addCol);
    colCtrl.appendChild(remCol);

    // Row controls — bottom-left
    const rowCtrl = document.createElement("div");
    rowCtrl.style.cssText = `position:absolute;bottom:-26px;left:0;display:flex;gap:2px;`;
    rowCtrl.contentEditable = "false";
    const addRow = document.createElement("button");
    addRow.innerHTML = iconAdd("#D16436");
    addRow.style.cssText = btn + btnHover;
    addRow.title = "Ajouter une ligne";
    const remRow = document.createElement("button");
    remRow.innerHTML = iconMinus("#8B1A1A");
    remRow.style.cssText = btn + btnHover;
    remRow.title = "Supprimer la dernière ligne";
    rowCtrl.appendChild(addRow);
    rowCtrl.appendChild(remRow);

    // Delete table — bottom-right
    const delCtrl = document.createElement("div");
    delCtrl.style.cssText = `position:absolute;bottom:-26px;right:0;display:flex;gap:2px;`;
    delCtrl.contentEditable = "false";
    const delBtn = document.createElement("button");
    delBtn.innerHTML = iconDel;
    delBtn.style.cssText = btn + btnHover;
    delBtn.title = "Supprimer le tableau";
    delCtrl.appendChild(delBtn);

    let tbl = buildTable(2, 2);
    container.appendChild(tbl);
    container.appendChild(colCtrl);
    container.appendChild(rowCtrl);
    container.appendChild(delCtrl);

    const refresh = () => {
      onChange(getHtml());
      if (editorRef.current) {
        const evt = new CustomEvent("contentchange", { bubbles: true });
        editorRef.current.dispatchEvent(evt);
      }
      editorRef.current?.focus();
    };

    addCol.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const curRows = tbl.querySelectorAll("tr").length;
      const curCols = tbl.querySelectorAll("tr:first-child th, tr:first-child td").length;
      const newTbl = buildTable(curRows, curCols + 1);
      const oldRows = tbl.querySelectorAll("tr");
      const newRows = newTbl.querySelectorAll("tr");
      oldRows.forEach((tr, ri) => {
        const cells = tr.querySelectorAll("th, td");
        cells.forEach((c, ci) => { if (newRows[ri]?.children[ci]) newRows[ri].children[ci].textContent = (c as HTMLElement).textContent || ""; });
      });
      tbl.replaceWith(newTbl);
      tbl = newTbl;
      refresh();
    };
    remCol.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const curCols = tbl.querySelectorAll("tr:first-child th, tr:first-child td").length;
      if (curCols <= 1) return;
      tbl.querySelectorAll("tr").forEach((tr) => tr.removeChild(tr.lastElementChild!));
      refresh();
    };
    addRow.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const curCols = tbl.querySelectorAll("tr:first-child th, tr:first-child td").length;
      const newRow = document.createElement("tr");
      for (let c = 0; c < curCols; c++) {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.innerHTML = "&nbsp;";
        td.style.cssText = "border:1px solid #121313;padding:6px 10px;min-width:60px;min-height:1em;";
        newRow.appendChild(td);
      }
      tbl.appendChild(newRow);
      refresh();
    };
    remRow.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const curRows = tbl.querySelectorAll("tr").length;
      if (curRows <= 1) return;
      tbl.removeChild(tbl.lastElementChild!);
      refresh();
    };
    delBtn.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm("Supprimer ce tableau ?")) return;
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
          refresh();
        }
      }, 0);
    };

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(container);
      const br2 = document.createElement("br");
      container.parentNode?.insertBefore(br2, container.nextSibling);
      sel.removeAllRanges();
      const r3 = document.createRange();
      r3.setStartAfter(br2);
      r3.collapse(true);
      sel.addRange(r3);
    }
    onChange(getHtml());
    editorRef.current?.focus();
  }, []);

  const handleInput = () => {
    onChange(getHtml());
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && onClose) {
      onClose();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        document.execCommand("insertLineBreak");
      } else {
        document.execCommand("insertParagraph");
      }
    }
  };

  const handleValidate = () => {
    const html = showSource ? sourceText : getHtml();
    // When in source mode, sync source back to editor before saving
    if (onSave) onSave(html);
    else onChange(html);
    if (onClose) onClose();
  };

  const toggleSource = () => {
    if (!showSource) {
      const html = editorRef.current?.innerHTML || "";
      setSourceText(html || savedValue.current);
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceText;
      }
      onChange(sourceText);
    }
    setShowSource(!showSource);
  };

  const handleSourceChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setSourceText(e.target.value);
  };

  const isActive = (fmt: string) => activeFormats.includes(fmt);

  return (
    <div className={`w-full ${resizable ? "flex-1 min-h-0 flex flex-col" : ""} ${
      inline
        ? "bg-transparent border border-brand-dark/10"
        : "border border-brand-dark/10 bg-transparent shadow-xl rounded-sm"
    }`} style={inline ? {} : { minWidth: "500px" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-0.5 border-t border-b border-brand-dark/10 bg-brand-steel/50 overflow-visible">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("bold"); }}
          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-sm transition-colors cursor-pointer ${isActive("bold") && !showSource ? "bg-brand-dark text-brand-light" : "text-brand-dark hover:bg-brand-dark/10"} ${showSource ? "opacity-30" : ""}`}
          title="Gras"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("italic"); }}
          className={`w-8 h-8 flex items-center justify-center text-xs italic rounded-sm transition-colors cursor-pointer ${isActive("italic") && !showSource ? "bg-brand-dark text-brand-light" : "text-brand-dark hover:bg-brand-dark/10"} ${showSource ? "opacity-30" : ""}`}
          title="Italique"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("underline"); }}
          className={`w-8 h-8 flex items-center justify-center text-xs underline rounded-sm transition-colors cursor-pointer ${isActive("underline") && !showSource ? "bg-brand-dark text-brand-light" : "text-brand-dark hover:bg-brand-dark/10"} ${showSource ? "opacity-30" : ""}`}
          title="Souligné"
        >
          U
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-1 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10"
          title={showAdvanced ? "Masquer les outils avancés" : "Afficher les outils avancés"}
        >
          <span className="font-bold leading-none">{showAdvanced ? "−" : "+"}</span>
        </button>
        {showAdvanced && (<>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("formatBlock", "h2"); }}
          className={`px-2 h-8 flex items-center justify-center text-xs font-bold rounded-sm transition-colors cursor-pointer ${isActive("h2") && !showSource ? "bg-brand-dark text-brand-light" : "text-brand-dark hover:bg-brand-dark/10"} ${showSource ? "opacity-30" : ""}`}
          title="Titre H2"
        >
          H<sub>2</sub>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("formatBlock", "h3"); }}
          className={`px-2 h-8 flex items-center justify-center text-xs font-bold rounded-sm transition-colors cursor-pointer ${isActive("h3") && !showSource ? "bg-brand-dark text-brand-light" : "text-brand-dark hover:bg-brand-dark/10"} ${showSource ? "opacity-30" : ""}`}
          title="Titre H3"
        >
          H<sub>3</sub>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("formatBlock", "p"); }}
          className={`px-2 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Paragraphe"
        >
          ¶
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("insertUnorderedList"); }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Liste à puces"
        >
          •≡
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!showSource) exec("insertOrderedList"); }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Liste numérotée"
        >
          1.
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onClick={() => { if (showSource) return; insertTable(); }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Insérer un tableau 2×2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e: ReactMouseEvent) => { e.preventDefault(); if (showSource) return; changeFontSize(0.5); }}
          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Augmenter la taille du texte sélectionné"
        >
          <span className="text-sm leading-none">A</span><sup className="text-[8px]">+</sup>
        </button>
        <button
          type="button"
          onMouseDown={(e: ReactMouseEvent) => { e.preventDefault(); if (showSource) return; changeFontSize(-0.5); }}
          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Réduire la taille du texte sélectionné"
        >
          <span className="text-sm leading-none">A</span><sup className="text-[8px]">−</sup>
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); if (showSource) return; setShowAlignDropdown(!showAlignDropdown); }}
            className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""} ${showAlignDropdown ? "bg-brand-dark/10" : ""}`}
            title="Alignement"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="18" y2="14"/><line x1="3" y1="18" x2="12" y2="18"/>
              <polyline points="17 4 21 8 17 12" fill="none" strokeWidth="1.5"/>
            </svg>
          </button>
          {showAlignDropdown && (
            <div className="absolute z-50 top-full mt-1 left-0 bg-brand-light border border-brand-dark/10 shadow-md rounded-sm flex flex-col p-1 gap-0.5 min-w-[36px]" onClick={() => setShowAlignDropdown(false)}>
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!showSource) { setAlignSelection("left"); setShowAlignDropdown(false); } }}
                className={`w-8 h-7 flex items-center justify-center rounded-sm cursor-pointer ${isActive("justifyLeft") ? "bg-brand-dark/10" : "hover:bg-brand-dark/5"} text-brand-dark`} title="Aligner à gauche">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="18" y2="14"/><line x1="3" y1="18" x2="12" y2="18"/></svg>
              </button>
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!showSource) { setAlignSelection("center"); setShowAlignDropdown(false); } }}
                className={`w-8 h-7 flex items-center justify-center rounded-sm cursor-pointer ${isActive("justifyCenter") ? "bg-brand-dark/10" : "hover:bg-brand-dark/5"} text-brand-dark`} title="Centrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="5" y1="14" x2="19" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
              </button>
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!showSource) { setAlignSelection("right"); setShowAlignDropdown(false); } }}
                className={`w-8 h-7 flex items-center justify-center rounded-sm cursor-pointer ${isActive("justifyRight") ? "bg-brand-dark/10" : "hover:bg-brand-dark/5"} text-brand-dark`} title="Aligner à droite">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="6" y1="14" x2="21" y2="14"/><line x1="12" y1="18" x2="21" y2="18"/></svg>
              </button>
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!showSource) { setAlignSelection("justify"); setShowAlignDropdown(false); } }}
                className={`w-8 h-7 flex items-center justify-center rounded-sm cursor-pointer ${isActive("justifyFull") ? "bg-brand-dark/10" : "hover:bg-brand-dark/5"} text-brand-dark`} title="Justifier">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
          )}
        </div>
        <button
          ref={colorBtnRef}
          type="button"
          onClick={(e) => { e.preventDefault(); if (showSource) return; setShowColorPicker(!showColorPicker); }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""} ${showColorPicker ? "bg-brand-dark/10" : ""}`}
          title="Couleur du texte"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
        {showColorPicker && colorBtnRef.current && (
          <div
            className="fixed z-[100] bg-brand-light border border-brand-dark/10 shadow-md rounded-sm p-1.5 flex gap-1"
            style={{
              left: colorBtnRef.current.getBoundingClientRect().left,
              top: colorBtnRef.current.getBoundingClientRect().bottom + 4,
            }}
          >
            {[
              { label: "Rouille", hex: "#D16436" },
              { label: "Foncé", hex: "#121313" },
              { label: "Gris", hex: "#7F8484" },
              { label: "Rouge", hex: "#8B1A1A" },
              { label: "Vert", hex: "#1B5E20" },
              { label: "Ambre", hex: "#B06000" },
              { label: "Bleu", hex: "#1A73E8" },
            ].map((c) => (
              <button
                key={c.hex}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); document.execCommand("foreColor", false, c.hex); editorRef.current?.focus(); setShowColorPicker(false); }}
                className="w-6 h-6 rounded-sm border border-brand-dark/10 cursor-pointer hover:scale-110 transition-transform shrink-0"
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); document.execCommand("foreColor", false, "inherit"); editorRef.current?.focus(); setShowColorPicker(false); }}
              className="w-6 h-6 rounded-sm border border-brand-dark/20 cursor-pointer hover:scale-110 transition-transform shrink-0 flex items-center justify-center text-[9px] font-mono text-brand-gray"
              title="Réinitialiser"
            >
              ✕
            </button>
          </div>
        )}
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand("undo"); editorRef.current?.focus(); }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Annuler (Ctrl+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand("redo"); editorRef.current?.focus(); }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Rétablir (Ctrl+Shift+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const editor = editorRef.current;
            if (!editor) return;
            // Unwrap all data-fs spans
            editor.querySelectorAll("[data-fs]").forEach((el) => {
              const span = el as HTMLElement;
              span.removeAttribute("data-fs");
              span.removeAttribute("style");
              const parent = span.parentNode;
              if (parent) {
                while (span.firstChild) parent.insertBefore(span.firstChild, span);
                parent.removeChild(span);
              }
            });
            // Clear inline style + class on blocks, reset H2/H3 to P
            editor.querySelectorAll("p, h1, h2, h3, h4, h5, h6").forEach((el) => {
              const b = el as HTMLElement;
              b.style.cssText = "";
              b.className = "";
              if (["H1","H2","H3","H4","H5","H6"].includes(b.tagName)) {
                const p = document.createElement("p");
                p.innerHTML = b.innerHTML;
                b.parentNode?.replaceChild(p, b);
              }
            });
            // Remove text-align from divs
            editor.querySelectorAll("div[style*='text-align']").forEach((el) => {
              (el as HTMLElement).style.removeProperty("text-align");
            });
            onChange(getHtml());
          }}
          className={`w-8 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 ${showSource ? "opacity-30" : ""}`}
          title="Supprimer la mise en forme"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
        <span className="w-px h-6 bg-brand-dark/10 mx-1" />
        <button
          type="button"
          onClick={toggleSource}
          className={`px-2 h-8 flex items-center justify-center text-xs font-mono rounded-sm transition-colors cursor-pointer ${showSource ? "bg-brand-rust text-brand-light" : "text-brand-dark hover:bg-brand-dark/10"}`}
          title="Afficher/éditer le code source HTML"
        >
          &lt;/&gt;
        </button>
        </>)}
        <div className="flex-1" />
        {onClose && !inline && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer text-brand-dark hover:bg-brand-dark/10 mr-1"
            title="Annuler"
          >
            Annuler
          </button>
        )}
        {onSave && !inline && (
          <button
            type="button"
            onClick={handleValidate}
            className="px-3 h-8 flex items-center justify-center text-xs rounded-sm transition-colors cursor-pointer bg-emerald-600 text-brand-light hover:bg-emerald-500"
            title="Publier"
          >
            ✓ Publier
          </button>
        )}
      </div>

      {/* Editable area */}
      {showSource ? (
        <textarea
          value={sourceText}
          onChange={handleSourceChange}
          className={`p-4 w-full font-mono text-brand-dark leading-relaxed bg-brand-steel/30 border-0 focus:outline-none resize-none ${resizable ? "flex-1 min-h-0 overflow-y-auto" : "min-h-[200px] max-h-[50vh] resize-vertical"}`}
          style={{ whiteSpace: "pre-wrap", ...(inline ? {} : { fontSize: editorFontSize }) }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onMouseUp={updateFormats}
          onKeyUp={updateFormats}
            className={`focus:outline-none bg-transparent ${
            inline
              ? editableClassName || "text-inherit"
              : "font-sans leading-relaxed prose prose-sm max-w-none [&_p]:mb-4 [&_p:last-child]:mb-0 p-4 text-brand-dark"
          } ${resizable ? "flex-1 min-h-0" : inline ? "min-h-[4.5rem]" : "min-h-[120px] max-h-[50vh] overflow-y-auto"}`}
          style={{ whiteSpace: "pre-wrap", ...(inline ? {} : { fontSize: editorFontSize }) }}
        />
      )}
    </div>
  );
}
