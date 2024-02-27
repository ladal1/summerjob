export const getGeocodingData = async (address: string) => {
  try {
    // Replace spaces with +
    const formattedAddress = address.replace(/\s/g, '+');
    
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${formattedAddress}`);
    const data = await response.json()
    if (data.length > 0) {
      const latitude = parseFloat(data[0].lat)
      const longitude = parseFloat(data[0].lon)
      return { latitude, longitude };
    } 
    else {
      return null;
    }
  } 
  catch (error) {
    return null;
  }
}

export const getReverseGeocodingData = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    const data = await response.json();
    return data.display_name;
  } 
  catch (error) {
    return null;
  }
}