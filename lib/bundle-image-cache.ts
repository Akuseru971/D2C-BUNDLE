import { processProductImage } from "@/lib/remove-white-background";
import { BUNDLE_BADGE_SRC } from "@/lib/bundle-editor";

const rawCache = new Map<string, HTMLImageElement>();
const productCache = new Map<string, HTMLImageElement>();
const badgeCache = new Map<string, HTMLImageElement>();
const rawLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const productLoadPromises = new Map<string, Promise<HTMLImageElement>>();
let badgeLoadPromise: Promise<HTMLImageElement> | null = null;

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

/** Promotional badge — full color artwork, no background stripping. */
export function getCachedBadge(): Promise<HTMLImageElement> {
  const key = BUNDLE_BADGE_SRC;
  const cached = badgeCache.get(key);
  if (cached?.complete) return Promise.resolve(cached);

  if (badgeLoadPromise) return badgeLoadPromise;

  badgeLoadPromise = loadRawImage(key)
    .then((img) => {
      badgeCache.set(key, img);
      badgeLoadPromise = null;
      return img;
    })
    .catch((err) => {
      badgeLoadPromise = null;
      throw err;
    });

  return badgeLoadPromise;
}

export function getCachedImage(src: string): Promise<HTMLImageElement> {
  return loadRawImage(src);
}

export type BundleImages = {
  productA: HTMLImageElement;
  productB: HTMLImageElement;
  badge: HTMLImageElement;
};

export function preloadBundleImages(
  productAUrl: string,
  productBUrl: string,
): Promise<BundleImages> {
  return Promise.all([
    getCachedProductImage(productAUrl),
    getCachedProductImage(productBUrl),
    getCachedBadge(),
  ]).then(([productA, productB, badge]) => ({
    productA,
    productB,
    badge,
  }));
}
