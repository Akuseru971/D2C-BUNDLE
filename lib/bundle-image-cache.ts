import {
  processBadgeImage,
  processProductImage,
} from "@/lib/remove-white-background";
import { PRODUCT_LAYER_IDS, type ProductLayerId } from "@/lib/bundle-editor";
import type { BundleImageSet } from "@/lib/bundle-layout";

const rawCache = new Map<string, HTMLImageElement>();
const productCache = new Map<string, HTMLImageElement>();
const logoCache = new Map<string, HTMLImageElement>();
const backgroundCache = new Map<string, HTMLImageElement>();
const rawLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const productLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const logoLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const backgroundLoadPromises = new Map<string, Promise<HTMLImageElement>>();

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

export function getCachedLogo(src: string): Promise<HTMLImageElement> {
  const cached = logoCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  const pending = logoLoadPromises.get(src);
  if (pending) return pending;

  const promise = loadRawImage(src)
    .then(processBadgeImage)
    .then((img) => {
      logoCache.set(src, img);
      logoLoadPromises.delete(src);
      return img;
    })
    .catch((err) => {
      logoLoadPromises.delete(src);
      throw err;
    });

  logoLoadPromises.set(src, promise);
  return promise;
}

export function getCachedBackground(src: string): Promise<HTMLImageElement> {
  const cached = backgroundCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  const pending = backgroundLoadPromises.get(src);
  if (pending) return pending;

  const promise = loadRawImage(src).then((img) => {
    backgroundCache.set(src, img);
    backgroundLoadPromises.delete(src);
    return img;
  });

  backgroundLoadPromises.set(src, promise);
  return promise;
}

export function preloadBundleImages(
  productUrls: ReadonlyArray<string | null | undefined>,
  logoUrl?: string | null,
  backgroundUrl?: string | null,
): Promise<BundleImageSet> {
  const productPromises = PRODUCT_LAYER_IDS.map((layer, index) => {
    const url = productUrls[index];
    if (!url) return Promise.resolve(null);
    return getCachedProductImage(url).then(
      (img): { layer: ProductLayerId; img: HTMLImageElement } => ({
        layer,
        img,
      }),
      () => null,
    );
  });

  return Promise.all([
    Promise.all(productPromises),
    logoUrl ? getCachedLogo(logoUrl) : Promise.resolve(null),
    backgroundUrl ? getCachedBackground(backgroundUrl) : Promise.resolve(null),
  ]).then(([productEntries, logo, background]) => {
    const products: Partial<Record<ProductLayerId, HTMLImageElement>> = {};
    for (const entry of productEntries) {
      if (!entry) continue;
      products[entry.layer] = entry.img;
    }
    return { products, logo, background };
  });
}
