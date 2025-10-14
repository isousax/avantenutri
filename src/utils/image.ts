// Utilidades de imagem compartilhadas

export async function processImageToJpeg(
  file: File,
  opts: {
    maxSize: number;
    quality: number;
    crop?: { x: number; y: number; width: number; height: number };
    targetAspect?: number; // ex.: 16/9 para center-crop automático
  }
): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Falha ao carregar imagem'));
    image.src = dataUrl;
  });

  let crop = opts.crop;
  const baseCanvas = document.createElement('canvas');
  // Se não houver crop explícito e alvo de aspecto fornecido, fazer center-crop
  if (!crop && opts.targetAspect && isFinite(opts.targetAspect) && opts.targetAspect > 0) {
    const imgAspect = img.width / img.height;
    const target = opts.targetAspect;
    if (imgAspect > target) {
      // muito largo: cortar lados
      const h = img.height;
      const w = Math.floor(h * target);
      const x = Math.floor((img.width - w) / 2);
      crop = { x, y: 0, width: w, height: h };
    } else if (imgAspect < target) {
      // muito alto: cortar topo/baixo
      const w = img.width;
      const h = Math.floor(w / target);
      const y = Math.floor((img.height - h) / 2);
      crop = { x: 0, y, width: w, height: h };
    } else {
      // já está na razão
      crop = { x: 0, y: 0, width: img.width, height: img.height };
    }
  }

  if (crop) {
    baseCanvas.width = Math.floor(crop.width);
    baseCanvas.height = Math.floor(crop.height);
  } else {
    baseCanvas.width = img.width;
    baseCanvas.height = img.height;
  }
  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) throw new Error('Sem contexto canvas');
  baseCtx.fillStyle = '#ffffff';
  baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
  if (crop) {
    baseCtx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );
  } else {
    baseCtx.drawImage(img, 0, 0);
  }

  const scale = Math.min(opts.maxSize / baseCanvas.width, opts.maxSize / baseCanvas.height, 1);
  const outW = Math.max(1, Math.floor(baseCanvas.width * scale));
  const outH = Math.max(1, Math.floor(baseCanvas.height * scale));
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Sem contexto redimensionado');
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, outW, outH);
  outCtx.drawImage(baseCanvas, 0, 0, outW, outH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (!b) reject(new Error('Falha ao gerar imagem final'));
      else resolve(b);
    }, 'image/jpeg', opts.quality);
  });

  const baseName = file.name.replace(/\.[^.]+$/i, '') || 'imagem';
  const jpegFile = new File([blob], `${baseName}.jpeg`, { type: 'image/jpeg' });
  return jpegFile;
}

export function extractBlogMediaPath(src: string): string | null {
  try {
    const u = new URL(src, window.location.origin);
    const m = u.pathname.match(/\/blog\/media\/(.+)$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
