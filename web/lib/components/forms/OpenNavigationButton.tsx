import React from 'react'

interface OpenNavigationButtonProps {
  coordinates: [number, number]
}

export const OpenNavigationButton = ({ 
  coordinates 
}: OpenNavigationButtonProps) => {
  const openNavigation = () => {
    const [latitude, longitude] = coordinates
    
    const isiOS = navigator.userAgent.match(/iPhone|iPad|iPod/i)

    if (isiOS) {
      // Open Apple Maps
      window.open(`https://maps.apple.com/maps?q=${latitude},${longitude}`)
    } 
    else {
      // Open Google maps website (on android phone it will open google map app)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
    }
  }

  return (
    
    <button 
      className="btn btn-primary btn-with-icon"
      type="button"
      onClick={openNavigation}
    >
      <label className="form-check-label cursor-pointer">
        <i className="fa-solid fa-arrow-up-right-from-square me-2"></i>
          <span>
            Otevřít navigaci
          </span>
        </label>
    </button>
  )
}