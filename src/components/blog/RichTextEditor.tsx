import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  Eraser,
  Image as ImageIcon,
  Palette,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/ui/ToastProvider';
import { API } from '../../config/api';
import { processImageToJpeg } from '../../utils/image';
import { deleteBlogMediaByUrl } from '../../utils/blogMedia';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

// Text size classes available (module scope for stable identity)
const TEXT_SIZE_CLASSES = ['text-xs','text-sm','text-base','text-lg','text-xl','text-2xl','text-3xl','text-4xl','text-5xl'] as const;

// Helper to run document.execCommand with focus management
function runCmd(command: string, value?: string) {
  try {
    document.execCommand(command, false, value ?? undefined);
  } catch {
    /* noop */
  }
}


const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [foreColor, setForeColor] = useState<string>("#111111");
  const { getAccessToken, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const { push } = useToast();


  // Helper: get current block element for selection
  const getCurrentBlock = useCallback((): HTMLElement | null => {
    const root = ref.current;
    if (!root) return null;
    const sel = document.getSelection();
    if (!sel || !sel.focusNode) return null;
    let node: Node | null = sel.focusNode;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    while (node && node instanceof HTMLElement) {
      if (node === root) break;
      const tag = node.tagName;
      if (tag === 'P' || tag === 'DIV' || tag === 'LI' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }, []);

  // Normalize and emit HTML on input/content changes
  const handleInput = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Normalize presentational attributes/styles into Tailwind classes for persistence
    const html = el.innerHTML
      // align attribute to classes
      .replace(/<(p|div|h1|h2|h3|h4|h5|h6)([^>]*?)\s+align="center"([^>]*)>/gi, '<$1$2 class="text-center"$3>')
      .replace(/<(p|div|h1|h2|h3|h4|h5|h6)([^>]*?)\s+align="right"([^>]*)>/gi, '<$1$2 class="text-right"$3>')
      .replace(/<(p|div|h1|h2|h3|h4|h5|h6)([^>]*?)\s+align="left"([^>]*)>/gi, '<$1$2 class="text-left"$3>')
      .replace(/<(p|div|h1|h2|h3|h4|h5|h6)([^>]*?)\s+align="justify"([^>]*)>/gi, '<$1$2 class="text-justify"$3>')
      // style text-align to classes (block and span)
      .replace(/<(p|div|h1|h2|h3|h4|h5|h6|span)([^>]*?)\s+style="([^"]*?)text-align:\s*(left|right|center|justify);?([^"]*?)"([^>]*)>/gi, (_m, tag, pre, _preStyle, align, _postStyle, post) => {
        const alignCls = align.toLowerCase() === 'center' ? 'text-center' : align.toLowerCase() === 'right' ? 'text-right' : align.toLowerCase() === 'left' ? 'text-left' : 'text-justify';
        return `<${tag}${pre} class="${alignCls}"${post}>`;
      })
      // inline font-size to tailwind text-*
      .replace(/<(p|span|div)([^>]*?)\s+style="([^"]*?)font-size:\s*(\d+)px;?([^"]*?)"([^>]*)>/gi, (_m, tag, pre, preStyle, size, postStyle, post) => {
        const n = parseInt(size, 10) || 16;
          // basic mapping
          const sizeCls = n <= 12 ? 'text-xs' : n <= 14 ? 'text-sm' : n <= 16 ? 'text-base' : n <= 18 ? 'text-lg' : n <= 20 ? 'text-xl' : n <= 24 ? 'text-2xl' : n <= 30 ? 'text-3xl' : n <= 36 ? 'text-4xl' : 'text-5xl';
        // also capture text-align if present in style to avoid losing it
        const styleAll = `${preStyle} ${postStyle}`.toLowerCase();
        let alignCls = '';
        if (styleAll.includes('text-align')) {
          if (styleAll.includes('text-align: center')) alignCls = 'text-center';
          else if (styleAll.includes('text-align: right')) alignCls = 'text-right';
          else if (styleAll.includes('text-align: left')) alignCls = 'text-left';
          else if (styleAll.includes('text-align: justify')) alignCls = 'text-justify';
        }
        const classes = alignCls ? `${sizeCls} ${alignCls}` : sizeCls;
        return `<${tag}${pre} class="${classes}"${post}>`;
      })
      // clear remaining style attributes (sanitizer vai remover de qualquer forma)
      .replace(/\sstyle="[^"]*"/gi, '')
      ;
    onChange(html);
  }, [onChange]);

  // Apply Tailwind text size to current block (removing previous size classes)
  const applyTextSizeClass = useCallback((cls: typeof TEXT_SIZE_CLASSES[number]) => {
    const root = ref.current;
    if (!root) return;
    let block = getCurrentBlock();
    if (!block) {
      // If not inside a block, wrap selection into a P
      runCmd('formatBlock', 'P');
      block = getCurrentBlock();
    }
    if (block) {
      TEXT_SIZE_CLASSES.forEach(c => block!.classList.remove(c));
      block.classList.add(cls);
      // Trigger change
      handleInput();
    }
  }, [getCurrentBlock, handleInput]);

  // Helpers to get and change current text size
  const getCurrentTextSizeIndex = useCallback((): number => {
    const block = getCurrentBlock();
    if (!block) return TEXT_SIZE_CLASSES.indexOf('text-base');
    for (let i = TEXT_SIZE_CLASSES.length - 1; i >= 0; i--) {
      if (block.classList.contains(TEXT_SIZE_CLASSES[i])) return i;
    }
    return TEXT_SIZE_CLASSES.indexOf('text-base');
  }, [getCurrentBlock]);

  const increaseTextSize = useCallback(() => {
    const idx = getCurrentTextSizeIndex();
    const next = Math.min(idx + 1, TEXT_SIZE_CLASSES.length - 1);
    applyTextSizeClass(TEXT_SIZE_CLASSES[next]);
  }, [getCurrentTextSizeIndex, applyTextSizeClass]);

  const decreaseTextSize = useCallback(() => {
    const idx = getCurrentTextSizeIndex();
    const next = Math.max(idx - 1, 0);
    applyTextSizeClass(TEXT_SIZE_CLASSES[next]);
  }, [getCurrentTextSizeIndex, applyTextSizeClass]);

  // Mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);

  // Image selection and overlay state
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgBox, setImgBox] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);
  const [resizing, setResizing] = useState<null | { corner: 'nw'|'ne'|'sw'|'se'; startX: number; startY: number; startW: number; startH: number; ratio: number }>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reposition mobile dropdown when opened and on scroll/resize
  useEffect(() => {
    if (!isMobile || !showMoreTools) return;

    const calcPos = () => {
      const btn = moreBtnRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;
      const b = btn.getBoundingClientRect();
      const margin = 8;
      const maxW = Math.max(120, window.innerWidth - margin * 2);
      const maxH = Math.max(80, window.innerHeight - margin * 2);
      const mw = Math.min(menu.offsetWidth || 220, maxW);
      const mh = Math.min(menu.offsetHeight || 200, maxH);
      const left = Math.min(
        Math.max(b.right - mw, margin),
        window.innerWidth - mw - margin
      );
      // Preferir abrir ACIMA; se não couber, abre ABAIXO
      let top = b.top - mh - margin;
      if (top < margin) {
        top = Math.min(b.bottom + margin, window.innerHeight - mh - margin);
      }
      setMenuPos({ left: Math.round(left), top: Math.round(top) });
    };

    // reset and compute after render (dois frames para capturar reflow)
    setMenuPos(null);
    const raf = requestAnimationFrame(() => {
      calcPos();
      requestAnimationFrame(calcPos);
    });
    const onScroll = () => calcPos();
    const onResize = () => calcPos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isMobile, showMoreTools]);

  // Keep innerHTML in sync when external value changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const askLink = () => {
    const url = window.prompt('Informe a URL do link:');
    if (!url) return;
    runCmd('createLink', url);
  };

  const onClickUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const looksImageByExt = ['jpg','jpeg','png','gif','webp','bmp','svg','avif'].includes(ext);
    if (!(file.type?.startsWith('image/') || looksImageByExt)) {
      alert('Por favor selecione uma imagem.');
      inputEl.value = '';
      return;
    }
    
    try {
      setUploading(true);
      const processed = await processImageToJpeg(file, { maxSize: 1600, quality: 0.6 });
      const token = await getAccessToken?.();
      const form = new FormData();
      form.append('file', processed);
      const res = await fetch(API.BLOG_MEDIA_UPLOAD, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Falha no upload');
      }
      const data = await res.json();
      const imageUrl: string | undefined = data?.url;
      if (imageUrl) {
        runCmd('insertImage', imageUrl);
        handleInput();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar imagem';
      push({ type: 'error', message });
    } finally {
      setUploading(false);
      inputEl.value = '';
    }
  };

  const setBlock = (tag: 'P'|'H1'|'H2'|'H3') => {
    runCmd('formatBlock', tag);
  };

  const applyColor = (color: string) => {
    setForeColor(color);
    runCmd('foreColor', color);
  };

  // Select image on click inside editor
  const onEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target && target instanceof HTMLImageElement) {
      e.preventDefault();
      setSelectedImg(target);
      queueMicrotask(() => updateOverlayBox());
    } else {
      if (!resizing) {
        setSelectedImg(null);
        setImgBox(null);
      }
    }
  };

  // Touch events for mobile image selection
  const onEditorTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target && target instanceof HTMLImageElement) {
      e.preventDefault();
      setSelectedImg(target);
      queueMicrotask(() => updateOverlayBox());
    } else {
      if (!resizing) {
        setSelectedImg(null);
        setImgBox(null);
      }
    }
  };

  const updateOverlayBox = useCallback(() => {
    if (!selectedImg) { setImgBox(null); return; }
    const imgRect = selectedImg.getBoundingClientRect();
    const wrap = editorWrapRef.current?.getBoundingClientRect();
    if (!wrap) { setImgBox(null); return; }
    setImgBox({
      left: imgRect.left - wrap.left + editorScrollLeft(editorWrapRef.current),
      top: imgRect.top - wrap.top + editorScrollTop(editorWrapRef.current),
      width: imgRect.width,
      height: imgRect.height,
    });
  }, [selectedImg]);

  const onWindowChange = useCallback(() => {
    if (selectedImg) updateOverlayBox();
  }, [selectedImg, updateOverlayBox]);

  useEffect(() => {
    window.addEventListener('scroll', onWindowChange, true);
    window.addEventListener('resize', onWindowChange);
    return () => {
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('resize', onWindowChange);
    };
  }, [onWindowChange]);

  useEffect(() => { updateOverlayBox(); }, [updateOverlayBox]);


  const deleteImageFromR2 = useCallback(async (src: string) => {
    await deleteBlogMediaByUrl(src, getAccessToken);
  }, [getAccessToken]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new MutationObserver(async (mutations) => {
      for (const m of mutations) {
        m.removedNodes.forEach(async (node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.getAttribute('src') || '';
            await deleteImageFromR2(src);
          } else if (node instanceof HTMLElement) {
            node.querySelectorAll('img').forEach(async (img) => {
              const src = img.getAttribute('src') || '';
              await deleteImageFromR2(src);
            });
          }
        });
      }
    });
    obs.observe(el, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [deleteImageFromR2]);

  function editorScrollTop(el: HTMLDivElement | null) { return el ? el.scrollTop : 0; }
  function editorScrollLeft(el: HTMLDivElement | null) { return el ? el.scrollLeft : 0; }

  // Enhanced resize handlers for touch
  const startResize = (corner: 'nw'|'ne'|'sw'|'se') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg) return;
    const rect = selectedImg.getBoundingClientRect();
    const ratio = rect.width / rect.height || 1;
    setResizing({ corner, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height, ratio });
    document.addEventListener('mousemove', onResizing);
    document.addEventListener('mouseup', stopResize, { once: true });
  };

  const startResizeTouch = (corner: 'nw'|'ne'|'sw'|'se') => (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg) return;
    const rect = selectedImg.getBoundingClientRect();
    const ratio = rect.width / rect.height || 1;
    const touch = e.touches[0];
    setResizing({ corner, startX: touch.clientX, startY: touch.clientY, startW: rect.width, startH: rect.height, ratio });
    document.addEventListener('touchmove', onResizingTouch, { passive: false });
    document.addEventListener('touchend', stopResizeTouch, { once: true });
  };

  const onResizing = (e: MouseEvent) => {
    if (!resizing || !selectedImg) return;
    const dx = e.clientX - resizing.startX;
    let newW = resizing.startW;
    if (resizing.corner === 'se') {
      newW = Math.max(50, resizing.startW + dx);
    } else if (resizing.corner === 'sw') {
      newW = Math.max(50, resizing.startW - dx);
    } else if (resizing.corner === 'ne') {
      newW = Math.max(50, resizing.startW + dx);
    } else if (resizing.corner === 'nw') {
      newW = Math.max(50, resizing.startW - dx);
    }
    selectedImg.style.width = `${Math.round(newW)}px`;
    selectedImg.style.height = 'auto';
    updateOverlayBox();
  };

  const onResizingTouch = (e: TouchEvent) => {
    if (!resizing || !selectedImg) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - resizing.startX;
    let newW = resizing.startW;
    if (resizing.corner === 'se') {
      newW = Math.max(50, resizing.startW + dx);
    } else if (resizing.corner === 'sw') {
      newW = Math.max(50, resizing.startW - dx);
    } else if (resizing.corner === 'ne') {
      newW = Math.max(50, resizing.startW + dx);
    } else if (resizing.corner === 'nw') {
      newW = Math.max(50, resizing.startW - dx);
    }
    selectedImg.style.width = `${Math.round(newW)}px`;
    selectedImg.style.height = 'auto';
    updateOverlayBox();
  };

  const stopResize = (e?: MouseEvent) => {
    void e;
    document.removeEventListener('mousemove', onResizing);
    setResizing(null);
    handleInput();
  };

  const stopResizeTouch = (e?: TouchEvent) => {
    void e;
    document.removeEventListener('touchmove', onResizingTouch);
    setResizing(null);
    handleInput();
  };

  const quickWidth = (pct: 25|50|75|100) => {
    if (!selectedImg) return;
    const wrap = editorWrapRef.current?.getBoundingClientRect();
    if (!wrap) return;
    const newW = Math.max(50, Math.floor((wrap.width * pct) / 100));
    selectedImg.style.width = `${newW}px`;
    selectedImg.style.height = 'auto';
    updateOverlayBox();
    handleInput();
  };

  // Main toolbar buttons
  const mainToolbarButtons = (
    <>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Negrito" onClick={() => runCmd('bold')}><Bold size={isMobile ? 18 : 16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Itálico" onClick={() => runCmd('italic')}><Italic size={isMobile ? 18 : 16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Sublinhado" onClick={() => runCmd('underline')}><Underline size={isMobile ? 18 : 16} /></button>
      
      <span className="w-px h-5 bg-gray-200 mx-1" />

      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Parágrafo" onClick={() => setBlock('P')}><Type size={isMobile ? 18 : 16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Título H1" onClick={() => setBlock('H1')}><Heading1 size={isMobile ? 18 : 16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Título H2" onClick={() => setBlock('H2')}><Heading2 size={isMobile ? 18 : 16} /></button>

      {/* Text size controls A-/A+ */}
      <div className="inline-flex items-center ml-1">
        <button
          type="button"
          className="px-2 py-1 hover:bg-gray-100 rounded text-sm font-medium touch-manipulation"
          title="Diminuir tamanho (A-)"
          onClick={decreaseTextSize}
        >
          A-
        </button>
        <button
          type="button"
          className="ml-1 px-2 py-1 hover:bg-gray-100 rounded text-sm font-medium touch-manipulation"
          title="Aumentar tamanho (A+)"
          onClick={increaseTextSize}
        >
          A+
        </button>
      </div>

      {(user?.role === 'admin' || user?.role === 'nutri') && (
        <button 
          type="button" 
          className="p-2 hover:bg-gray-100 rounded touch-manipulation inline-flex items-center gap-1" 
          title={uploading ? 'Enviando...' : 'Fazer upload de imagem'} 
          onClick={onClickUploadImage} 
          disabled={uploading}
        >
          <ImageIcon size={isMobile ? 18 : 16} />
          {uploading && !isMobile && <span className="text-xs text-gray-700">Enviando...</span>}
        </button>
      )}
    </>
  );

  // Secondary toolbar buttons (hidden behind more menu on mobile)
  const secondaryToolbarButtons = (
    <>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Tachado" onClick={() => runCmd('strikeThrough')}><Strikethrough size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Título H3" onClick={() => setBlock('H3')}><Heading3 size={16} /></button>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Alinhar à esquerda" onClick={() => runCmd('justifyLeft')}><AlignLeft size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Centralizar" onClick={() => runCmd('justifyCenter')}><AlignCenter size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Alinhar à direita" onClick={() => runCmd('justifyRight')}><AlignRight size={16} /></button>
  <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Justificar" onClick={() => runCmd('justifyFull')}><AlignJustify size={16} /></button>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Lista não ordenada" onClick={() => runCmd('insertUnorderedList')}><List size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Lista ordenada" onClick={() => runCmd('insertOrderedList')}><ListOrdered size={16} /></button>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Inserir link" onClick={askLink}><LinkIcon size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Remover link" onClick={() => runCmd('unlink')}><Unlink size={16} /></button>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      <label className="inline-flex items-center gap-2 p-1 text-xs text-gray-700 touch-manipulation">
        <Palette size={14} /> Cor
        <input type="color" value={foreColor} onChange={(e) => applyColor(e.target.value)} className="w-6 h-6 p-0 border-0 touch-manipulation" />
      </label>

      <span className="w-px h-5 bg-gray-200 mx-1" />

      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Desfazer" onClick={() => runCmd('undo')}><Undo2 size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Refazer" onClick={() => runCmd('redo')}><Redo2 size={16} /></button>
      <button type="button" className="p-2 hover:bg-gray-100 rounded touch-manipulation" title="Limpar formatação" onClick={() => runCmd('removeFormat')}><Eraser size={16} /></button>
    </>
  );

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-200 rounded-t-lg bg-gray-50">
        {mainToolbarButtons}
        
        {isMobile && (
          <div className="relative">
            <button
              ref={moreBtnRef}
              type="button"
              className="p-2 hover:bg-gray-100 rounded touch-manipulation"
              onClick={() => setShowMoreTools(!showMoreTools)}
              title="Mais ferramentas"
            >
              <MoreVertical size={18} />
            </button>

            {showMoreTools && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreTools(false)}
                />

                {/* Dropdown menu (fixed, viewport-clamped) */}
                <div
                  ref={menuRef}
                  className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]"
                  style={{
                    left: menuPos ? menuPos.left : 0,
                    top: menuPos ? menuPos.top : 0,
                    visibility: menuPos ? 'visible' : 'hidden',
                    maxWidth: 'calc(100vw - 16px)',
                    maxHeight: 'calc(100vh - 16px)',
                    overflowY: 'auto',
                  }}
                >
                  <div className="flex flex-wrap gap-1">
                    {secondaryToolbarButtons}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {!isMobile && secondaryToolbarButtons}
        
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="sr-only absolute w-px h-px opacity-0" 
          onChange={handleFileSelected} 
        />
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorWrapRef}
          className="relative"
        >
          <div
            ref={ref}
            contentEditable
            className="min-h-[220px] p-3 border border-t-0 border-gray-200 rounded-b-lg bg-white focus:outline-none prose max-w-none text-base leading-relaxed"
            onInput={handleInput}
            onMouseDown={onEditorMouseDown}
            onTouchStart={onEditorTouchStart}
            suppressContentEditableWarning
            data-placeholder={placeholder}
            style={{ 
              WebkitUserSelect: 'text',
              WebkitTapHighlightColor: 'transparent',
              fontSize: '16px' // Prevent zoom on iOS
            }}
          />
          
          {/* Image overlay with resize handles and toolbar */}
          {selectedImg && imgBox && (
            <div
              className="pointer-events-none"
              style={{ 
                position: 'absolute', 
                left: imgBox.left, 
                top: imgBox.top, 
                width: imgBox.width, 
                height: imgBox.height 
              }}
            >
              {/* Border highlight */}
              <div className="absolute inset-0 border-2 border-blue-500/70 rounded-sm" />
              
              {/* Enhanced resize handles for mobile */}
              <div 
                onMouseDown={startResize('nw')}
                onTouchStart={startResizeTouch('nw')}
                className={`absolute -top-2 -left-2 bg-blue-600 rounded-sm cursor-nwse-resize pointer-events-auto touch-manipulation ${
                  isMobile ? 'w-6 h-6' : 'w-3 h-3'
                }`} 
              />
              <div 
                onMouseDown={startResize('ne')}
                onTouchStart={startResizeTouch('ne')}
                className={`absolute -top-2 -right-2 bg-blue-600 rounded-sm cursor-nesw-resize pointer-events-auto touch-manipulation ${
                  isMobile ? 'w-6 h-6' : 'w-3 h-3'
                }`} 
              />
              <div 
                onMouseDown={startResize('sw')}
                onTouchStart={startResizeTouch('sw')}
                className={`absolute -bottom-2 -left-2 bg-blue-600 rounded-sm cursor-nesw-resize pointer-events-auto touch-manipulation ${
                  isMobile ? 'w-6 h-6' : 'w-3 h-3'
                }`} 
              />
              <div 
                onMouseDown={startResize('se')}
                onTouchStart={startResizeTouch('se')}
                className={`absolute -bottom-2 -right-2 bg-blue-600 rounded-sm cursor-nwse-resize pointer-events-auto touch-manipulation ${
                  isMobile ? 'w-6 h-6' : 'w-3 h-3'
                }`} 
              />

              {/* Enhanced floating toolbar for mobile */}
              <div className={`absolute left-1/2 transform -translate-x-1/2 pointer-events-auto select-none ${
                isMobile ? '-top-12' : '-top-9'
              }`}>
                <div className={`flex items-center gap-1 bg-white border border-gray-200 rounded shadow-lg ${
                  isMobile ? 'px-3 py-2 text-sm' : 'px-2 py-1 text-xs'
                }`}>
                  <button 
                    type="button" 
                    className={`hover:bg-gray-100 rounded touch-manipulation ${
                      isMobile ? 'px-3 py-2' : 'px-2 py-1'
                    }`}
                    onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation();}} 
                    onClick={()=>quickWidth(25)}
                  >25%</button>
                  <button 
                    type="button" 
                    className={`hover:bg-gray-100 rounded touch-manipulation ${
                      isMobile ? 'px-3 py-2' : 'px-2 py-1'
                    }`}
                    onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation();}} 
                    onClick={()=>quickWidth(50)}
                  >50%</button>
                  <button 
                    type="button" 
                    className={`hover:bg-gray-100 rounded touch-manipulation ${
                      isMobile ? 'px-3 py-2' : 'px-2 py-1'
                    }`}
                    onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation();}} 
                    onClick={()=>quickWidth(75)}
                  >75%</button>
                  <button 
                    type="button" 
                    className={`hover:bg-gray-100 rounded touch-manipulation ${
                      isMobile ? 'px-3 py-2' : 'px-2 py-1'
                    }`}
                    onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation();}} 
                    onClick={()=>quickWidth(100)}
                  >100%</button>
                  <span className="w-px h-4 bg-gray-200 mx-1" />
                  <button
                    type="button"
                    className={`text-red-600 hover:bg-red-50 rounded touch-manipulation ${
                      isMobile ? 'px-3 py-2' : 'px-2 py-1'
                    }`}
                    onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation();}}
                    onClick={async (e)=>{
                      e.stopPropagation();
                      const img = selectedImg;
                      setSelectedImg(null);
                      setImgBox(null);
                      if (img && img.parentElement) {
                        const src = img.getAttribute('src') || '';
                        img.parentElement.removeChild(img);
                        await deleteImageFromR2(src);
                        handleInput();
                      }
                    }}
                  >{isMobile ? 'Excluir' : 'X'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
        }
        .prose img {
          display: block;
          margin: 12px auto;
          height: auto;
          max-width: 100%;
        }
        /* Improve touch scrolling */
        .touch-manipulation {
          touch-action: manipulation;
        }
        /* Better text selection */
        [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
        }
        /* Prevent zoom on iOS */
        @media screen and (max-width: 768px) {
          [contenteditable] {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;