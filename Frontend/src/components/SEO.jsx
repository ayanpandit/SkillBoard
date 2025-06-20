import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import seoConfig from '../seoConfig';

const SEO = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  
  // Get SEO data for current path or use default
  const seoData = seoConfig[path] || seoConfig['default'];
  
  useEffect(() => {
    // Update title
    document.title = seoData.title;
    
    // Update meta tags
    updateMetaTag('description', seoData.description);
    updateMetaTag('keywords', seoData.keywords);
    
    // Update Open Graph tags
    updateMetaTag('og:title', seoData.ogTitle);
    updateMetaTag('og:description', seoData.ogDescription);
    updateMetaTag('og:url', seoData.canonicalUrl);
    updateMetaTag('og:image', seoData.ogImage);
    
    // Update Twitter tags
    updateMetaTag('twitter:title', seoData.ogTitle);
    updateMetaTag('twitter:description', seoData.ogDescription);
    updateMetaTag('twitter:image', seoData.ogImage);
    
    // Update canonical URL
    updateCanonicalLink(seoData.canonicalUrl);
    
    // Clean up function
    return () => {
      // If needed, you could reset tags here
    };
  }, [path, seoData]);
  
  const updateMetaTag = (name, content) => {
    // First check if the meta tag exists
    let metaTag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    
    if (metaTag) {
      // Update existing tag
      metaTag.setAttribute('content', content);
    } else {
      // Create new tag
      metaTag = document.createElement('meta');
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        metaTag.setAttribute('property', name);
      } else {
        metaTag.setAttribute('name', name);
      }
      metaTag.setAttribute('content', content);
      document.head.appendChild(metaTag);
    }
  };
  
  const updateCanonicalLink = (href) => {
    // First check if canonical link exists
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    
    if (canonicalLink) {
      // Update existing link
      canonicalLink.setAttribute('href', href);
    } else {
      // Create new link
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', href);
      document.head.appendChild(canonicalLink);
    }
  };
  
  // This component doesn't render anything visible
  return null;
};

export default SEO;
