export const calculateDimensions = (naturalWidth: number, naturalHeight: number, maxWidth: number, maxHeight: number) => {
  const aspectRatio = naturalWidth / naturalHeight

  if (naturalWidth < maxWidth && naturalHeight < maxWidth) {
    return {
      width: naturalWidth, 
      height: naturalHeight
    }
  }
  else if (naturalWidth >= naturalHeight) {
    return {
      width: Math.min(maxWidth, naturalWidth), 
      height: Math.min(maxWidth / aspectRatio, maxHeight)
    }
  } 
  else {
    return {
      width: Math.min(maxHeight * aspectRatio, maxWidth), 
      height: Math.min(maxHeight, naturalHeight)
    }
  }
}
