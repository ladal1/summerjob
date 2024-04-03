export const getGeocodingData = async (address: string | undefined): Promise<[number, number] | null> => {
  try {
    if(!address) {
      return null
    }
    // Replace spaces with +
    const formattedAddress = address.replace(/\s/g, '+')
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${formattedAddress}&accept-language=cz`)
    const data = await response.json()
    if (data.length > 0) {
      const latitude = parseFloat(data[0].lat)
      const longitude = parseFloat(data[0].lon)
      return [latitude, longitude]
    } 
    else {
      return null
    }
  } 
  catch (error) {
    return null
  }
}

export const getReverseGeocodingData = async (latitude: number | undefined, longitude: number | undefined) => {
  try {
    if(latitude === undefined || longitude === undefined) {
      return null
    }
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=cz`)
    const data = await response.json()
    return data.display_name
  } 
  catch (error) {
    return null
  }
}