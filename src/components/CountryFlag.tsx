import { ComponentProps } from 'react';

// Map country names to ISO 3166-1 alpha-2 codes
const countryCodeMap: Record<string, string> = {
  'Australia': 'AU',
  'China': 'CN',
  'Japan': 'JP',
  'Bahrain': 'BH',
  'Saudi Arabia': 'SA',
  'USA': 'US',
  'United States': 'US',
  'Canada': 'CA',
  'Monaco': 'MC',
  'Spain': 'ES',
  'Austria': 'AT',
  'UK': 'GB',
  'Belgium': 'BE',
  'Hungary': 'HU',
  'Netherlands': 'NL',
  'Italy': 'IT',
  'Azerbaijan': 'AZ',
  'Singapore': 'SG',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Qatar': 'QA',
  'UAE': 'AE',
  'United Arab Emirates': 'AE',
  'Abu Dhabi': 'AE',
};

interface CountryFlagProps extends Omit<ComponentProps<'img'>, 'src' | 'alt'> {
  country: string;
  className?: string;
}

/**
 * CountryFlag component - displays SVG flags that work on all platforms
 * Falls back to emoji if flag library not loaded
 */
export function CountryFlag({ country, className = '', ...props }: CountryFlagProps) {
  const countryCode = countryCodeMap[country];
  
  if (!countryCode) {
    // Fallback to a generic flag icon if country not mapped
    return <span className={`emoji ${className}`}>🏁</span>;
  }

  // Use CDN-hosted SVG flags
  const flagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`;

  return (
    <img 
      src={flagUrl} 
      alt={`${country} flag`}
      className={`inline-block ${className}`}
      loading="lazy"
      {...props}
    />
  );
}

export default CountryFlag;
