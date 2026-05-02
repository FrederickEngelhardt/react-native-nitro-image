import { useEffect, useMemo } from 'react'
import { type AsyncImageSource, isHybridObject } from './AsyncImageSource'
import { createImageLoader } from './createImageLoader'
import { markHybridObject } from './markHybridObject'
import type { Image } from './specs/Image.nitro'
import type { ImageLoader } from './specs/ImageLoader.nitro'

function getSourceKey(source: AsyncImageSource): string {
  if (isHybridObject(source)) {
    return `hybrid:${String(source)}`
  }

  return JSON.stringify(source)
}

function disposeLoader(loader: Image | ImageLoader | undefined): void {
  if (loader == null) {
    return
  }

  try {
    loader.dispose()
  } catch {
    // Cleanup path. Ignore dispose failures.
  }
}

export function useImageLoader(
  source: AsyncImageSource,
): Image | ImageLoader | undefined {
  const sourceKey = useMemo(() => getSourceKey(source), [source])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <sourceKey is derived from source and must reset the loader on change>
  const loader = useMemo<Image | ImageLoader | undefined>(() => {
    const nextLoader = createImageLoader(source)
    markHybridObject(nextLoader, source)
    return nextLoader
  }, [sourceKey, source])

  useEffect(() => {
    return () => {
      disposeLoader(loader)
    }
  }, [loader])

  return loader
}
