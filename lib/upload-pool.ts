/** Stop admitting new files on quota failure; let already accepted work finish. */
export async function runUploadPool<T>(items: T[], concurrency: number, upload: (item: T, index: number) => Promise<boolean>, skipped: (item: T) => void) {
  let cursor = 0, stopped = false;
  await Promise.all(Array.from({ length: Math.min(items.length, Math.max(1, concurrency)) }, async () => {
    while (!stopped && cursor < items.length) {
      const index = cursor++;
      if (!await upload(items[index], index)) stopped = true;
    }
  }));
  for (; cursor < items.length; cursor++) skipped(items[cursor]);
}
