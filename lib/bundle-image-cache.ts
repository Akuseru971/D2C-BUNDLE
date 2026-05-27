import {
  processLogoImage,
  processProductImage,
} from "@/lib/remove-white-background";
import { WMF_LOGO_SRC } from "@/lib/bundle-editor";

const rawCache = new Map<string, HTMLImageElement>();
const productCache = new Map<string, HTMLImageElement>();
const rawLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const productLoadPromises = new Map<string, Promise<HTMLImageElement>>();

function loadRawImage(src: string): Promise<HTMLImageElement> {
  const cached = rawCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  const pending = rawLoadPromises.get(src);
  if (pending) return pending;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      rawCache.set(src, img);
      rawLoadPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      rawLoadPromises.delete(src);
      reject(new Error("Failed to load image."));
    };
    img.src = src;
  });

  rawLoadPromises.set(src, promise);
  return promise;
}

/** Product image with white background removed — use for editor, preview & export. */
export function getCachedProductImage(
  src: string,
): Promise<HTMLImageElement> {
  const cached = productCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  const pending = productLoadPromises.get(src);
  if (pending) return pending;

  const promise = loadRawImage(src)
    .then(processProductImage)
    .then((processed) => {
      productCache.set(src, processed);
      productLoadPromises.delete(src);
      return processed;
    })
    .catch((err) => {
      productLoadPromises.delete(src);
      throw err;
    });

  productLoadPromises.set(src, promise);
  return promise;
}

export function getCachedImage(src: string): Promise<HTMLImageElement> {
  return loadRawImage(src);
}

const wmfLogoCache = new Map<string, HTMLImageElement>();
let wmfLogoPromise: Promise<HTMLImageElement> | null = null;

export function getCachedWmfLogo(): Promise<HTMLImageElement> {
  const key = WMF_LOGO_SRC;
  const cached = wmfLogoCache.get(key);
  if (cached?.complete) return Promise.resolve(cached);

  if (wmfLogoPromise) return wmfLogoPromise;

  wmfLogoPromise = loadRawImage(key)
    .then(processLogoImage)
    .then((processed) => {
      wmfLogoCache.set(key, processed);
      wmfLogoPromise = null;
      return processed;
    })
    .catch((err) => {
      wmfLogoPromise = null;
      throw err;
    });

  return wmfLogoPromise;
}

export type BundleImages = {
  productA: HTMLImageElement;
  productB: HTMLImageElement;
  wmfLogo: HTMLImageElement;
};

export function preloadBundleImages(
  productAUrl: string,
  productBUrl: string,
): Promise<BundleImages> {
  return Promise.all([
    getCachedProductImage(productAUrl),
    getCachedProductImage(productBUrl),
    getCachedWmfLogo(),
  ]).then(([productA, productB, wmfLogo]) => ({
    productA,
    productB,
    wmfLogo,
  }));
}
