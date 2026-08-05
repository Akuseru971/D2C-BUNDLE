import {
  processBadgeImage,
  processProductImage,
} from "@/lib/remove-white-background";
import { PRODUCT_LAYER_IDS, type ProductLayerId } from "@/lib/bundle-editor";
import type { BundleImageSet } from "@/lib/bundle-layout";
import {
  createDefaultProductCutouts,
  DEFAULT_CUTOUT_ENABLED,
  type ImageProcessingOptions,
} from "@/lib/image-processing-options";

const rawCache = new Map<string, HTMLImageElement>();
const processedCache = new Map<string, HTMLImageElement>();
const rawLoadPromises = new Map<string, Promise<HTMLImageElement>>();
const processedLoadPromises = new Map<string, Promise<HTMLImageElement>>();

function cacheKey(src: string, cutoutEnabled: boolean): string {
  return `${src}|cutout:${cutoutEnabled}`;
}

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

function getCachedProcessedImage(
  src: string,
  cutoutEnabled: boolean,
  processor: (img: HTMLImageElement) => Promise<HTMLImageElement>,
): Promise<HTMLImageElement> {
  if (!cutoutEnabled) {
    return loadRawImage(src);
  }

  const key = cacheKey(src, true);
  const cached = processedCache.get(key);
  if (cached?.complete) return Promise.resolve(cached);

  const pending = processedLoadPromises.get(key);
  if (pending) return pending;

  const promise = loadRawImage(src)
    .then(processor)
    .then((processed) => {
      processedCache.set(key, processed);
      processedLoadPromises.delete(key);
      return processed;
    })
    .catch((err) => {
      processedLoadPromises.delete(key);
      throw err;
    });

  processedLoadPromises.set(key, promise);
  return promise;
}

export function getCachedProductImage(
  src: string,
  cutoutEnabled = DEFAULT_CUTOUT_ENABLED,
): Promise<HTMLImageElement> {
  return getCachedProcessedImage(src, cutoutEnabled, processProductImage);
}

export function getCachedLogo(
  src: string,
  cutoutEnabled = DEFAULT_CUTOUT_ENABLED,
): Promise<HTMLImageElement> {
  return getCachedProcessedImage(src, cutoutEnabled, processBadgeImage);
}

export function getCachedBackground(src: string): Promise<HTMLImageElement> {
  return loadRawImage(src);
}

export function preloadBundleImages(
  productUrls: ReadonlyArray<string | null | undefined>,
  logoUrl?: string | null,
  backgroundUrl?: string | null,
  processing: ImageProcessingOptions = {
    productCutouts: createDefaultProductCutouts(productUrls.length),
    logoCutout: DEFAULT_CUTOUT_ENABLED,
  },
): Promise<BundleImageSet> {
  const productPromises = PRODUCT_LAYER_IDS.map((layer, index) => {
    const url = productUrls[index];
    if (!url) return Promise.resolve(null);
    const cutoutEnabled =
      processing.productCutouts[index] ?? DEFAULT_CUTOUT_ENABLED;
    return getCachedProductImage(url, cutoutEnabled).then(
      (img): { layer: ProductLayerId; img: HTMLImageElement } => ({
        layer,
        img,
      }),
      () => null,
    );
  });

  return Promise.all([
    Promise.all(productPromises),
    logoUrl
      ? getCachedLogo(logoUrl, processing.logoCutout)
      : Promise.resolve(null),
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
