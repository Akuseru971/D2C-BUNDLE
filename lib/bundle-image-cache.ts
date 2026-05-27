const imageCache = new Map<string, HTMLImageElement>();
const loadPromises = new Map<string, Promise<HTMLImageElement>>();

export function getCachedImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  const pending = loadPromises.get(src);
  if (pending) return pending;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      loadPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      loadPromises.delete(src);
      reject(new Error("Failed to load image."));
    };
    img.src = src;
  });

  loadPromises.set(src, promise);
  return promise;
}

export function preloadBundleImages(
  productAUrl: string,
  productBUrl: string,
): Promise<[HTMLImageElement, HTMLImageElement]> {
  return Promise.all([
    getCachedImage(productAUrl),
    getCachedImage(productBUrl),
  ]);
}
