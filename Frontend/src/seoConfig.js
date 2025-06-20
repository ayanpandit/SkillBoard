// SEO metadata configuration for different routes
const seoConfig = {
  // Home page
  '/': {
    title: 'SkillBoard – Coding Profile Analysis & Evaluation Tool',
    description: 'SkillBoard helps hiring teams shortlist candidates by analyzing coding profiles from CodeChef, LeetCode, and more platforms — fast, accurate, and reliable.',
    keywords: 'coding profile evaluation, competitive programming metrics, technical hiring, codechef analysis, leetcode analysis, candidate shortlisting tool',
    ogTitle: 'SkillBoard – Coding Profile Analysis for Technical Hiring',
    ogDescription: 'Shortlist top candidates faster by analyzing coding profiles from major competitive programming sites — get detailed metrics and performance insights with SkillBoard.',
    ogImage: 'https://www.skillboard.shop/logo.png',
    canonicalUrl: 'https://www.skillboard.shop/'
  },
  
  // LeetCode analyzer page
  '/leetcodeprofileanalyze': {
    title: 'LeetCode Profile Analyzer | Technical Hiring Tool | SkillBoard',
    description: 'Analyze LeetCode profiles for technical hiring decisions. Get comprehensive metrics on problem-solving abilities, algorithm proficiency, and coding patterns.',
    keywords: 'leetcode profile analyzer, leetcode hiring tool, algorithm assessment, coding interview metrics, technical recruitment',
    ogTitle: 'LeetCode Profile Analyzer for Technical Hiring | SkillBoard',
    ogDescription: 'Make data-driven hiring decisions with detailed analysis of candidates\' LeetCode profiles, problem-solving patterns, and algorithm proficiency.',
    ogImage: 'https://www.skillboard.shop/logo.png',
    canonicalUrl: 'https://www.skillboard.shop/leetcodeprofileanalyze'
  },
  
  // CodeChef analyzer page
  '/codechefloder': {
    title: 'CodeChef Profile Analyzer | Programming Skills Assessment | SkillBoard',
    description: 'Evaluate competitive programming skills using CodeChef profiles. Analyze contest participation, problem-solving efficiency, and coding ability for better hiring.',
    keywords: 'codechef profile analyzer, competitive programming assessment, technical hiring, programming skills evaluation',    ogTitle: 'CodeChef Profile Analyzer for Technical Recruitment | SkillBoard',
    ogDescription: 'Analyze candidate CodeChef profiles to evaluate competitive programming skills, problem-solving efficiency, and coding abilities for technical hiring.',
    ogImage: 'https://www.skillboard.shop/logo.png',
    canonicalUrl: 'https://www.skillboard.shop/codechefloder'
  },
  
  // About page
  '/about': {
    title: 'About SkillBoard | Coding Profile Analysis for Hiring',
    description: 'Learn how SkillBoard helps technical recruiters make data-driven hiring decisions using competitive programming profiles from CodeChef, LeetCode, and more.',
    keywords: 'technical recruitment tool, competitive programming assessment, coding profile analysis, hiring platform',
    ogTitle: 'About SkillBoard | Technical Hiring Platform',
    ogDescription: 'SkillBoard simplifies technical hiring by providing objective metrics from competitive programming profiles. Learn more about our recruitment analysis tools.',
    ogImage: 'https://www.skillboard.shop/logo.png',
    canonicalUrl: 'https://www.skillboard.shop/about'
  },
  
  // Profile page
  '/profile': {
    title: 'User Profile | SkillBoard Coding Analysis Platform',
    description: 'Manage your SkillBoard profile settings and access your competitive programming profile analyses and reports.',
    keywords: 'skillboard profile, coding profile management, technical skill assessment',
    ogTitle: 'User Profile | SkillBoard',
    ogDescription: 'Access your SkillBoard account settings and manage your competitive programming profile analyses.',
    ogImage: 'https://www.skillboard.shop/logo.png',
    canonicalUrl: 'https://www.skillboard.shop/profile'
  },
    // Fallback for any other routes
  'default': {
    title: 'SkillBoard – Coding Profile Analysis for Technical Hiring',
    description: 'SkillBoard helps recruiters analyze competitive programming profiles from CodeChef, LeetCode, and more to make data-driven technical hiring decisions.',
    keywords: 'coding profile analyzer, technical hiring platform, competitive programming assessment',
    ogTitle: 'SkillBoard – Technical Hiring Platform',
    ogDescription: 'Analyze competitive programming profiles to make better technical hiring decisions with SkillBoard.',
    ogImage: 'https://www.skillboard.shop/logo.png',
    canonicalUrl: 'https://www.skillboard.shop/'
  }
};

export default seoConfig;
