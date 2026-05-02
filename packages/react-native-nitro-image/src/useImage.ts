import { useEffect, useState } from 'react'
import type { AsyncImageSource } from './AsyncImageSource'
import { loadImage } from './loadImage'
import { markHybridObject } from './markHybridObject'
import type { Image } from './specs/Image.nitro'

type Result =
  | {
      image: undefined
      error: undefined
    }
  | {
      image: Image
      error: undefined
    }
  | {
      image: undefined
      error: Error
    }

function disposeImage(image: Image | undefined): void {
  if (image == null) {
    return
  }

  try {
    image.dispose()
  } catch {
    // Ignore cleanup failures.
  }
}

/**
 * A hook to asynchronously load an image from the given AsyncImageSource into memory.
 *
 * The returned Image is owned by this hook and is disposed when:
 * - source changes
 * - the component unmounts
 * - an async load resolves after cleanup
 */
export function useImage(source: AsyncImageSource): Result {
  const [result, setResult] = useState<Result>({
    image: undefined,
    error: undefined,
  })

  useEffect(() => {
    let isCancelled = false
    let ownedImage: Image | undefined

    setResult((previous) => {
      disposeImage(previous.image)

      return {
        image: undefined,
        error: undefined,
      }
    })

    ;(async () => {
      try {
        const loadedImage = await loadImage(source)

        if (isCancelled) {
          disposeImage(loadedImage)
          return
        }

        ownedImage = loadedImage
        markHybridObject(loadedImage, source)

        setResult((previous) => {
          if (previous.image !== loadedImage) {
            disposeImage(previous.image)
          }

          return {
            image: loadedImage,
            error: undefined,
          }
        })
      } catch (e) {
        if (isCancelled) {
          return
        }

        const error = e instanceof Error ? e : new Error(`${e}`)

        setResult((previous) => {
          disposeImage(previous.image)

          return {
            image: undefined,
            error,
          }
        })
      }
    })()

    return () => {
      isCancelled = true

      if (ownedImage != null) {
        disposeImage(ownedImage)
        ownedImage = undefined
      }
    }
  }, [source])

  return result
}
