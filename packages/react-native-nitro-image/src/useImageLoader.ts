import { useEffect, useMemo } from 'react'
import type { AsyncImageSource } from './AsyncImageSource'
import { createImageLoader } from './createImageLoader'
import { markHybridObject } from './markHybridObject'
import type { Image } from './specs/Image.nitro'
import type { ImageLoader } from './specs/ImageLoader.nitro'

function disposeImageOrLoader(
  imageOrLoader: Image | ImageLoader | undefined,
): void {
  if (imageOrLoader == null) {
    return
  }

  try {
    imageOrLoader.dispose()
  } catch {
    // Ignore cleanup failures.
  }
}

export function useImageLoader(
  source: AsyncImageSource,
): Image | ImageLoader | undefined {
  const imageOrLoader = useMemo<Image | ImageLoader | undefined>(() => {
    const nextImageOrLoader = createImageLoader(source)
    markHybridObject(nextImageOrLoader, source)
    return nextImageOrLoader
  }, [source])

  useEffect(() => {
    return () => {
      disposeImageOrLoader(imageOrLoader)
    }
  }, [imageOrLoader])

  return imageOrLoader
}
