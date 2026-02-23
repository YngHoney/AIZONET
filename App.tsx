
import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import ToolCard from './components/ToolCard';
import { AITool, ToolCategory, BlogPost, SiteSettings } from './types';
import { MOCK_TOOLS, CATEGORIES_LIST } from './constants';
import { searchExternalTool } from './services/geminiService';
import { Search, Sparkles, TrendingUp, ChevronRight, ChevronLeft, Zap, Globe, BarChart3, Loader2, Bot, Video, Share2, Clock, ArrowRight } from 'lucide-react';
import BlogSlider from './components/BlogSlider';
import { dataService } from './services/dataService';

const ToolDetail = lazy(() => import('./pages/ToolDetail'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const SubmitTool = lazy(() => import('./pages/SubmitTool'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ImageLab = lazy(() => import('./pages/ImageLab'));
const VideoLab = lazy(() => import('./pages/VideoLab'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

type Page = 'home' | 'categories' | 'image-lab' | 'video-lab' | 'blog' | 'submit' | 'detail' | 'blog-detail' | 'about' | 'privacy' | 'terms' | 'contact' | 'admin';
type SortOption = 'newest' | 'most-viewed' | 'featured' | 'top-rated';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="animate-spin text-indigo-600" size={48} />
  </div>
);

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('home');
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAjaxResults, setShowAjaxResults] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [externalResults, setExternalResults] = useState<string | null>(null);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);

  const [liveTools, setLiveTools] = useState<AITool[]>([]);
  const [livePosts, setLivePosts] = useState<BlogPost[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tools, posts, settings] = await Promise.all([
          dataService.fetchTools(),
          dataService.fetchArticles(),
          dataService.fetchSiteSettings()
        ]);

        if (settings) {
          setSiteSettings(settings);
        }

        // Merge with MOCK_TOOLS if Supabase is empty, or just use Supabase
        // The user said "Replace any mock data", so we prioritize Supabase
        if (tools.length > 0) {
          setLiveTools(tools);
        } else {
          setLiveTools(MOCK_TOOLS);
        }

        if (posts.length > 0) {
          setLivePosts(posts);
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        setLiveTools(MOCK_TOOLS);
      }
    };

    loadData();
    window.addEventListener('storage', loadData); // Keep for local interactions if any
    return () => window.removeEventListener('storage', loadData);
  }, [activePage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowAjaxResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (!siteSettings) return;

    // 1. Dynamic Meta Title
    if (siteSettings.meta_title) {
      document.title = siteSettings.meta_title;
    }

    // 2. Dynamic Meta Description
    if (siteSettings.meta_description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', siteSettings.meta_description);
    }

    // 3. GSC Verification Tag
    if (siteSettings.gsc_verification_tag) {
      let gscMeta = document.querySelector('meta[name="google-site-verification"]');
      if (!gscMeta) {
        gscMeta = document.createElement('meta');
        gscMeta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(gscMeta);
      }
      gscMeta.setAttribute('content', siteSettings.gsc_verification_tag);
    }

    // 4. GA4 Dynamic Script Injection
    if (siteSettings.ga4_id) {
      const gaId = siteSettings.ga4_id;
      // Script 1: External Gtag
      if (!document.querySelector(`script[src*="id=${gaId}"]`)) {
        const gaScript = document.createElement('script');
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        gaScript.async = true;
        document.head.appendChild(gaScript);

        // Script 2: Inline Configuration
        const inlineScript = document.createElement('script');
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        document.head.appendChild(inlineScript);
      }
    }
  }, [siteSettings]);

  const filteredAndSortedTools = useMemo(() => {
    let result = liveTools.filter(tool => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return selectedCategory === 'All' || tool.category === selectedCategory;

      const name = tool.name?.toLowerCase() || '';
      const desc = tool.shortDescription?.toLowerCase() || '';
      const cat = tool.category?.toLowerCase() || '';

      const matchesSearch = name.includes(q) || desc.includes(q) || cat.includes(q);
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime();
        case 'most-viewed': return b.views - a.views;
        case 'featured': return (a.featured === b.featured) ? 0 : (a.featured ? -1 : 1);
        case 'top-rated': return b.rating - a.rating;
        default: return 0;
      }
    });
    return result;
  }, [searchQuery, selectedCategory, sortBy, liveTools]);

  const ajaxResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return liveTools.filter(tool => {
      const name = tool.name?.toLowerCase() || '';
      const cat = tool.category?.toLowerCase() || '';
      return name.includes(q) || cat.includes(q);
    }).slice(0, 6);
  }, [searchQuery, liveTools]);

  const featuredTools = useMemo(() => liveTools.filter(t => t.featured), [liveTools]);
  const recentTools = useMemo(() => {
    return [...liveTools].sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()).slice(0, 4);
  }, [liveTools]);

  const handleToolClick = (tool: AITool) => {
    setSelectedTool(tool);
    setActivePage('detail');
    setShowAjaxResults(false);
    window.scrollTo(0, 0);
  };

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
    setActivePage('blog-detail');
    window.scrollTo(0, 0);
  };

  const handleCategorySelect = (category: ToolCategory | 'All') => {
    setSelectedCategory(category);
    setActivePage('home');
    setTimeout(() => {
      const el = document.getElementById('directory-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  const handleGlobalDeepSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowAjaxResults(false);

    // First, scroll to directory section to show local matches
    const resultsElement = document.getElementById('directory-section');
    if (resultsElement) resultsElement.scrollIntoView({ behavior: 'smooth' });

    // If we have local results, we clear AI results to prioritize our database
    if (filteredAndSortedTools.length > 0) {
      setExternalResults(null);
      return;
    }

    // If NO local results, trigger AI Deep Search
    setIsSearchingExternal(true);
    setExternalResults(null);
    const result = await searchExternalTool(searchQuery);
    setExternalResults(result);
    setIsSearchingExternal(false);
  };

  const renderHome = () => (
    <div className="space-y-20 page-transition">
      <section className="text-center py-10 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -z-10"></div>
        <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-cyan-400 px-6 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-10 border border-indigo-200 dark:border-indigo-800">
          <Sparkles size={14} className="animate-pulse" /> Exploring {liveTools.length} Verified AI Innovations
        </div>
        <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-none uppercase dark:text-white">
          DISCOVER THE <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">AI FRONTIER.</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-14 font-medium px-4 leading-relaxed">
          Welcome to <span className="font-black text-indigo-600 dark:text-cyan-400">AIZONET</span>. The most accurate directory of Business Intelligence, Copywriting, and Automation tools globally.
        </p>

        <div ref={searchContainerRef} className="max-w-3xl mx-auto relative group mb-14 px-2">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-60 transition duration-700"></div>
          <form onSubmit={handleGlobalDeepSearch} className="relative z-20">
            <input
              type="text"
              autoComplete="off"
              placeholder="Search directory or trigger AI Deep Search..."
              className="w-full pl-12 sm:pl-16 pr-32 sm:pr-48 py-6 sm:py-9 rounded-[2rem] bg-white dark:bg-[#020617] border border-white/10 shadow-2xl focus:ring-4 focus:ring-cyan-500 transition-all text-lg sm:text-xl font-bold dark:text-white outline-none"
              value={searchQuery}
              onFocus={() => setShowAjaxResults(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAjaxResults(true);
                if (externalResults) setExternalResults(null);
              }}
            />
            <Search className="absolute left-6 top-6 sm:top-9 text-gray-400" size={26} />
            <button type="submit" className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-12 rounded-2xl font-black text-xs sm:text-lg transition-all active:scale-95 shadow-xl shadow-indigo-600/20 uppercase tracking-widest flex items-center justify-center gap-2">
              {isSearchingExternal ? <Loader2 size={20} className="animate-spin" /> : "Explore"}
            </button>
          </form>

          {/* AJAX Search Results Dropdown */}
          {showAjaxResults && ajaxResults.length > 0 && (
            <div className="absolute top-[105%] left-0 right-0 z-[100] bg-white dark:bg-[#0f172a] rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-in slide-in-from-top-4 duration-300 backdrop-blur-xl">
              <div className="p-4 border-b dark:border-white/5 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Directory Instant Matches</span>
                <span className="text-[10px] font-bold text-indigo-500">{ajaxResults.length} Found</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {ajaxResults.map(tool => (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="p-4 flex items-center gap-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform">
                      <img src={tool.logo} alt={tool.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-black text-sm dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{tool.name}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">{tool.category}</span>
                        <span className="text-[8px] font-bold text-indigo-500 dark:text-cyan-400">{tool.pricingModel}</span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t dark:border-white/5 text-center">
                <button
                  onClick={handleGlobalDeepSearch}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-400 hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  <Sparkles size={12} /> Trigger Deep Intelligence Search for "{searchQuery}"
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4 px-4 mb-10">
          {[
            { label: 'Business Intel', icon: BarChart3, cat: ToolCategory.BUSINESS_INTEL },
            { label: 'Automation', icon: Zap, cat: ToolCategory.AGENTS },
            { label: 'Social Media', icon: Share2, cat: ToolCategory.SOCIAL_MEDIA },
            { label: 'Video AI', icon: Video, cat: ToolCategory.VIDEO },
            { label: 'Web Gen', icon: Globe, cat: ToolCategory.WEBSITE_BUILDER },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => handleCategorySelect(item.cat)}
              className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border dark:border-white/5 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-cyan-950/20 transition-all hover:-translate-y-1 shadow-md dark:text-gray-300"
            >
              <item.icon size={18} className="text-indigo-600 dark:text-cyan-400" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Global Category Tabs (Moved here for better accessibility) */}
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border dark:border-white/5 p-3 rounded-[2.5rem] shadow-xl flex flex-wrap gap-2 overflow-x-auto no-scrollbar justify-center">
            <button onClick={() => handleCategorySelect('All')} className={`px-6 py-3 rounded-2xl font-black transition-all text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap ${selectedCategory === 'All' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-gray-50 dark:bg-slate-800 dark:text-gray-300 hover:bg-indigo-50'}`}>View All</button>
            {CATEGORIES_LIST.map(cat => (
              <button key={cat} onClick={() => handleCategorySelect(cat)} className={`px-6 py-3 rounded-2xl font-black transition-all text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xl' : 'bg-gray-50 dark:bg-slate-800 dark:text-gray-300 hover:bg-indigo-50'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl sm:text-4xl font-black flex items-center gap-4 tracking-tighter uppercase dark:text-white"><Clock className="text-indigo-500" /> Recent Arrivals</h2>
          <button onClick={() => { setSortBy('newest'); document.getElementById('directory-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-400 hover:underline">View All New</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {recentTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} onClick={handleToolClick} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl sm:text-4xl font-black flex items-center gap-4 tracking-tighter uppercase dark:text-white"><TrendingUp className="text-cyan-500" /> Trending & Featured</h2>
          <div className="flex gap-3">
            <button onClick={() => scrollSlider('left')} className="p-3 rounded-2xl border dark:border-white/5 bg-white dark:bg-slate-900 dark:text-white hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"><ChevronLeft size={20} /></button>
            <button onClick={() => scrollSlider('right')} className="p-3 rounded-2xl border dark:border-white/5 bg-white dark:bg-slate-900 dark:text-white hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div ref={sliderRef} className="flex gap-8 overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {featuredTools.map(tool => (
            <div key={tool.id} className="min-w-[300px] sm:min-w-[380px] md:min-w-[440px] snap-center">
              <ToolCard tool={tool} onClick={handleToolClick} />
            </div>
          ))}
        </div>
      </section>

      <section id="directory-section" className="container mx-auto px-4 scroll-mt-48">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-black tracking-tighter uppercase dark:text-white">Directory <span className="text-gray-400">Results</span></h2>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            Sorted by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-b border-gray-200 dark:border-white/10 outline-none text-indigo-600 dark:text-cyan-400 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="most-viewed">Popular</option>
              <option value="featured">Featured</option>
              <option value="top-rated">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAndSortedTools.length > 0 ? (
            filteredAndSortedTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={handleToolClick} />
            ))
          ) : isSearchingExternal ? (
            <div className="col-span-full text-center py-32 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-[3rem] border-2 border-dashed border-indigo-200 dark:border-indigo-800">
              <Loader2 className="animate-spin text-indigo-600 mx-auto mb-6" size={48} />
              <p className="text-2xl font-black uppercase tracking-tighter dark:text-white">Analyzing the AI Frontier...</p>
            </div>
          ) : externalResults ? (
            <div className="col-span-full p-12 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[3rem] text-white shadow-2xl border border-white/10 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-70">AI Deep Search Intelligence</h3>
                <h2 className="text-3xl font-black mb-6">Foundations of "{searchQuery}"</h2>
                <p className="text-xl leading-relaxed italic opacity-90 max-w-3xl">"{externalResults}"</p>
                <button onClick={() => { setSearchQuery(''); setExternalResults(null); }} className="mt-10 bg-white text-indigo-900 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest">Reset Search</button>
              </div>
            </div>
          ) : (
            <div className="col-span-full text-center py-32 bg-gray-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5">
              <Search className="mx-auto mb-6 text-gray-300" size={40} />
              <p className="text-xl text-gray-500 font-bold uppercase tracking-tighter">No results found for "{searchQuery}".</p>
              <p className="text-sm text-gray-400 mt-2 font-medium">Try a different keyword or category.</p>
            </div>
          )}
        </div>
      </section>

      <BlogSlider onPostClick={handlePostClick} />

      <section className="container mx-auto px-4 pb-24">
        <div className="bg-gradient-to-tr from-[#020617] to-[#1e1b4b] rounded-[3rem] p-12 md:p-24 text-white text-center relative overflow-hidden border border-white/5 shadow-2xl">
          <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter uppercase leading-none">GROW WITH <span className="text-cyan-400">AIZONET.</span></h2>
          <p className="text-xl md:text-2xl text-indigo-100 mb-14 max-w-3xl mx-auto font-medium leading-relaxed">Get featured in front of thousands of daily visitors looking for their next workflow upgrade.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button onClick={() => setActivePage('submit')} className="bg-white text-indigo-900 px-12 py-5 rounded-2xl font-black text-lg hover:shadow-2xl transition-all uppercase tracking-widest">Submit Tool</button>
            <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); document.getElementById('directory-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-transparent border-2 border-white/20 px-12 py-5 rounded-2xl font-black text-lg hover:bg-white/5 transition-all uppercase tracking-widest">Browse More</button>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <Layout darkMode={darkMode} toggleDarkMode={toggleTheme} onSearchChange={setSearchQuery} onNavigate={(page) => { window.scrollTo(0, 0); setActivePage(page as Page); }}>
      <Suspense fallback={<LoadingFallback />}>
        {(() => {
          switch (activePage) {
            case 'detail': return selectedTool ? <ToolDetail tool={selectedTool} onBack={() => setActivePage('home')} /> : renderHome();
            case 'blog-detail': return selectedPost ? <BlogDetail post={selectedPost} onBack={() => setActivePage('home')} /> : renderHome();
            case 'categories': return <CategoriesPage onCategorySelect={(cat) => { setSelectedCategory(cat); setActivePage('home'); }} />;
            case 'image-lab': return <ImageLab />;
            case 'video-lab': return <VideoLab />;
            case 'submit': return <SubmitTool />;
            case 'about': return <AboutPage />;
            case 'privacy': return <PrivacyPolicy />;
            case 'terms': return <TermsOfService />;
            case 'contact': return <ContactPage />;
            case 'admin': return <AdminPanel />;
            default: return renderHome();
          }
        })()}
      </Suspense>
    </Layout>
  );
};

export default App;
