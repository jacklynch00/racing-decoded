// Driver image utilities

export async function getWikipediaImage(wikipediaUrl: string): Promise<string | null> {
  try {
    // Extract page title from Wikipedia URL
    const pageTitle = wikipediaUrl.split('/').pop();
    if (!pageTitle) return null;

    // Use Wikipedia REST API to get page summary with thumbnail
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Return high-resolution thumbnail if available
    const thumbnail = data.thumbnail?.source;
    if (thumbnail) {
      // Wikipedia thumbnails can be resized by modifying the URL
      // Replace width parameter to get higher resolution
      return thumbnail.replace(/\/\d+px-/, '/400px-');
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Wikipedia image:', error);
    return null;
  }
}

export function getDriverImageUrl(driverId: number, imageUrl?: string | null): string {
  // Priority order:
  // 1. Custom stored image URL
  // 2. Local image file
  // 3. Fallback to initials avatar
  
  if (imageUrl) {
    return imageUrl;
  }
  
  // Check for local image file
  const localImageUrl = `/images/drivers/${driverId}.jpg`;
  return localImageUrl;
}

export function getDriverInitials(name: string): string {
  const names = name.split(' ');
  const first = names[0]?.charAt(0) || '';
  const last = names[names.length - 1]?.charAt(0) || '';
  return (first + last).toUpperCase();
}