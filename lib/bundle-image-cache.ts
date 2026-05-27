import {
  processBadgeImage,
  processProductImage,
} from "@/lib/remove-white-background";
import { BUNDLE_BADGE_SRC } from "@/lib/bundle-editor";
import type { BundleImageSet } from "@/lib/bundle-layout";

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

export function getCachedBadge(): Promise<HTMLImageElement> {
  const key = BUNDLE_BADGE_SRC;
  const cached = badgeCache.get(key);
  if (cached?.complete) return Promise.resolve(cached);

  if (badgeLoadPromise) return badgeLoadPromise;

  badgeLoadPromise = loadRawImage(key)
    .then(processBadgeImage)
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

export function preloadBundleImages(
  productAUrl: string,
  productBUrl: string,
  productCUrl?: string | null,
): Promise<BundleImageSet> {
  const loads: [
    Promise<HTMLImageElement>,
    Promise<HTMLImageElement>,
    Promise<HTMLImageElement | null>,
    Promise<HTMLImageElement>,
  ] = [
    getCachedProductImage(productAUrl),
    getCachedProductImage(productBUrl),
    productCUrl
      ? getCachedProductImage(productCUrl)
      : Promise.resolve(null),
    getCachedBadge(),
  ];

  return Promise.all(loads).then(([productA, productB, productC, badge]) => ({
    productA,
    productB,
    productC,
    badge,
  }));
}
