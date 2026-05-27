import {
  processBadgeImage,
  processProductImage,
} from "@/lib/remove-white-background";
import type { BundleImageSet } from "@/lib/bundle-layout";

const rawCache = new Map<string, HTMLImageElement>();
const productCache = new Map<string, HTMLImageElement>();
const logoCache = new Map<string, HTMLImageElement>();
const rawLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const productLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const logoLoadPromises = new Map<string, Promise<HTMLImageElement>>();

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

export function preloadBundleImages(
  productAUrl: string,
  productBUrl: string,
  productCUrl?: string | null,
  logoUrl?: string | null,
): Promise<BundleImageSet> {
  return Promise.all([
    getCachedProductImage(productAUrl),
    getCachedProductImage(productBUrl),
    productCUrl ? getCachedProductImage(productCUrl) : Promise.resolve(null),
    logoUrl ? getCachedLogo(logoUrl) : Promise.resolve(null),
  ]).then(([productA, productB, productC, logo]) => ({
    productA,
    productB,
    productC,
    logo,
  }));
}
