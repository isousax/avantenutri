import React, { useEffect, useRef, useState } from 'react';
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
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  Eraser,
  Image as ImageIcon,
  Palette,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { API } from '../../config/api';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

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

  // Keep innerHTML in sync when external value changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    onChange(el.innerHTML);
  };

  const askLink = () => {
    const url = window.prompt('Informe a URL do link:');
    if (!url) return;
    runCmd('createLink', url);
  };

  const insertImage = () => {
    const url = window.prompt('Informe a URL da imagem:');
    if (!url) return;
    runCmd('insertImage', url);
  };

  const onClickUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Basic validations
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione uma imagem.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Imagem muito grande (limite 5MB).');
      return;
    }
    try {
      setUploading(true);
      const token = await getAccessToken?.();
      const form = new FormData();
      form.append('file', file);
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
        // trigger onChange since execCommand may not call input
        handleInput();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar imagem';
      alert(message);
    } finally {
      setUploading(false);
      // reset input so selecting the same file triggers change again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setBlock = (tag: 'P'|'H1'|'H2'|'H3') => {
    runCmd('formatBlock', tag);
  };

  const applyColor = (color: string) => {
    setForeColor(color);
    runCmd('foreColor', color);
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded-t-lg bg-gray-50">
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Negrito" onClick={() => runCmd('bold')}><Bold size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Itálico" onClick={() => runCmd('italic')}><Italic size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Sublinhado" onClick={() => runCmd('underline')}><Underline size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Tachado" onClick={() => runCmd('strikeThrough')}><Strikethrough size={16} /></button>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Parágrafo" onClick={() => setBlock('P')}><Type size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Título H1" onClick={() => setBlock('H1')}><Heading1 size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Título H2" onClick={() => setBlock('H2')}><Heading2 size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Título H3" onClick={() => setBlock('H3')}><Heading3 size={16} /></button>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Alinhar à esquerda" onClick={() => runCmd('justifyLeft')}><AlignLeft size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Centralizar" onClick={() => runCmd('justifyCenter')}><AlignCenter size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Alinhar à direita" onClick={() => runCmd('justifyRight')}><AlignRight size={16} /></button>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Lista não ordenada" onClick={() => runCmd('insertUnorderedList')}><List size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Lista ordenada" onClick={() => runCmd('insertOrderedList')}><ListOrdered size={16} /></button>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Inserir link" onClick={askLink}><LinkIcon size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Remover link" onClick={() => runCmd('unlink')}><Unlink size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Inserir imagem por URL" onClick={insertImage}><ImageIcon size={16} /></button>
        {(user?.role === 'admin' || user?.role === 'nutri') && (
          <>
            <button type="button" className="p-2 hover:bg-gray-100 rounded" title={uploading ? 'Enviando...' : 'Fazer upload de imagem'} onClick={onClickUploadImage} disabled={uploading}>
              <Upload size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="sr-only absolute w-px h-px opacity-0" onChange={handleFileSelected} />
          </>
        )}

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <label className="inline-flex items-center gap-2 p-1 text-xs text-gray-700">
          <Palette size={14} /> Cor
          <input type="color" value={foreColor} onChange={(e) => applyColor(e.target.value)} className="w-6 h-6 p-0 border-0" />
        </label>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Desfazer" onClick={() => runCmd('undo')}><Undo2 size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Refazer" onClick={() => runCmd('redo')}><Redo2 size={16} /></button>
        <button type="button" className="p-2 hover:bg-gray-100 rounded" title="Limpar formatação" onClick={() => runCmd('removeFormat')}><Eraser size={16} /></button>
      </div>

      {/* Editor */}
      <div
        ref={ref}
        contentEditable
        className="min-h-[220px] p-3 border border-t-0 border-gray-200 rounded-b-lg bg-white focus:outline-none prose max-w-none"
        onInput={handleInput}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF; /* gray-400 */
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
