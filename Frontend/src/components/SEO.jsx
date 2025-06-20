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
    updateMetaTag('og:type', 'website');
    
    // Update Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoData.ogTitle);
    updateMetaTag('twitter:description', seoData.ogDescription);
    updateMetaTag('twitter:image', seoData.ogImage);
    
    // Update canonical URL
    updateCanonicalLink(seoData.canonicalUrl);
    
    // Update structured data based on the page
    updateStructuredData(path, seoData);
    
    // Clean up function
    return () => {
      // Remove any structured data on unmount
      const existingScript = document.getElementById('structured-data');
      if (existingScript) {
        existingScript.remove();
      }
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
  
  const updateStructuredData = (path, seoData) => {
    // Remove any existing structured data
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create structured data based on the page
    let structuredData;
    
    if (path === '/') {
      // Home page - software application schema
      structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "SkillBoard",
        "description": seoData.description,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "120"
        },
        "url": seoData.canonicalUrl,
        "screenshot": seoData.ogImage,
        "featureList": "Coding Profile Analytics, Performance Metrics, Competitive Programming Stats, Bulk Search, Hiring Made Easy, Secure and Scalable"
      };
    } else if (path === '/leetcodeprofileanalyze' || path === '/codechefloder') {
      // Analyzer pages - web application schema
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": path === '/leetcodeprofileanalyze' ? "SkillBoard LeetCode Analyzer" : "SkillBoard CodeChef Analyzer",
        "url": seoData.canonicalUrl,
        "description": seoData.description,
        "applicationCategory": "Recruitment Tool",
        "offers": {
          "@type": "Offer",
          "price": "0"
        },
        "potentialAction": {
          "@type": "UseAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": seoData.canonicalUrl
          }
        },
        "keywords": seoData.keywords
      };
    } else {
      // Other pages - organization schema with software product
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "SkillBoard",
        "url": "https://www.skillboard.shop/",
        "logo": "https://www.skillboard.shop/logo.png",
        "description": "Technical hiring platform for analyzing competitive programming profiles",
        "makesOffer": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "SoftwareApplication",
            "name": "SkillBoard Coding Profile Analyzer",
            "description": "Tool for analyzing competitive programming profiles from platforms like CodeChef and LeetCode"
          }
        }
      };
    }
    
    // Add the structured data to the page
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };
  
  // This component doesn't render anything visible
  return null;
};

export default SEO;
