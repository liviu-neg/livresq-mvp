/**
 * Converts imageType ('fill' | 'fit' | 'stretch') to CSS backgroundSize value
 */
export function getBackgroundSize(imageType?: 'fill' | 'fit' | 'stretch'): string {
  switch (imageType) {
    case 'fit':
      return 'contain';
    case 'stretch':
      return '100% 100%';
    case 'fill':
    default:
      return 'cover';
  }
}

