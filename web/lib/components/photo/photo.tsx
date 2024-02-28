export const calculateDimensions = (naturalWidth: number, naturalHeight: number, maxSize: {maxWidth: number, maxHeight: number}) => {
  const aspectRatio = naturalWidth / naturalHeight

  if (naturalWidth < maxSize.maxWidth && naturalHeight < maxSize.maxWidth) {
    return {
      width: naturalWidth, 
      height: naturalHeight
    }
  }
  else if (naturalWidth >= naturalHeight) {
    return {
      width: Math.min(maxSize.maxWidth, naturalWidth), 
      height: Math.min(maxSize.maxWidth / aspectRatio, maxSize.maxHeight)
    }
  } 
  else {
    return {
      width: Math.min(maxSize.maxHeight * aspectRatio, maxSize.maxWidth), 
      height: Math.min(maxSize.maxHeight, naturalHeight)
    }
  }
}
