export function optimizeImage(dataUrl: string, fileType: string, fileSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const MAX_BYTES = 10 * 1024 * 1024;
      const isPng = fileType.startsWith("image/png");
      const mimeType = fileType;

      const capDim = (w: number, h: number, max: number) => {
        if (w > max || h > max) {
          if (w > h) { h = Math.round((h / w) * max); w = max; }
          else { w = Math.round((w / h) * max); h = max; }
        }
        return { width: w, height: h };
      };

      const renderCanvas = (w: number, h: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        if (isPng) ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        return canvas;
      };

      const toDataUrl = (canvas: HTMLCanvasElement, quality: number) => {
        if (isPng) {
          return canvas.toDataURL("image/png", quality);
        }
        return canvas.toDataURL(mimeType, quality);
      };

      // Under 10MB: preserve transparency, cap at 4096px
      if (fileSize <= MAX_BYTES) {
        const dims = capDim(width, height, 4096);
        const canvas = renderCanvas(dims.width, dims.height);
        resolve(toDataUrl(canvas, isPng ? 1 : 0.95));
        return;
      }

      // Over 10MB: try progressively smaller dimensions
      const dimensionSteps = [4096, 2048, 1200];

      const tryCompress = (maxDim: number): string | null => {
        const dims = capDim(width, height, maxDim);
        const canvas = renderCanvas(dims.width, dims.height);

        if (maxDim <= 1200) {
          const result = toDataUrl(canvas, isPng ? 0.8 : 0.3);
          return result.length * 0.75 <= MAX_BYTES ? result : null;
        }

        let best = toDataUrl(canvas, 1.0);
        if (best.length * 0.75 <= MAX_BYTES) return best;

        if (isPng) {
          return toDataUrl(canvas, 0.8);
        }

        let low = 0.08, high = 1.0;
        for (let iter = 0; iter < 12; iter++) {
          const mid = Math.round((low + high) * 50) / 100;
          const candidate = canvas.toDataURL(mimeType, mid);
          const size = candidate.length * 0.75;
          if (size <= MAX_BYTES) { best = candidate; low = mid + 0.01; }
          else { high = mid - 0.01; }
          if (low > high) break;
        }
        return best;
      };

      let result: string | null = null;
      for (const dim of dimensionSteps) {
        if (result) break;
        if (width <= dim && height <= dim && dim !== dimensionSteps[0]) continue;
        result = tryCompress(dim);
      }
      if (!result) {
        const dims = capDim(width, height, 1200);
        const canvas = renderCanvas(dims.width, dims.height);
        result = toDataUrl(canvas, isPng ? 0.7 : 0.2);
      }
      resolve(result);
    };
    img.onerror = () => reject(new Error("Impossible de charger l'image"));
    img.src = dataUrl;
  });
}
