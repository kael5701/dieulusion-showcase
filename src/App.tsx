/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Product Interface
interface Product {
  id: string;
  name: string;
  category: string;
  affiliateLink: string;
  image: string;
  setIds: string[]; // e.g., ["H1", "H2"]
}

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhRn-AgNeeGSn6t6RIRbcDTUEIhFOBEfzTTl-O8mvZ31JCIKHVf7f_wAU4E70TVt1dYmBlaYZbbPlC/pub?gid=0&single=true&output=csv';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const parseCSV = (csvText: string): Product[] => {
    const lines = csvText.split('\n');
    const result: Product[] = [];
    
    // Skip header: Category,ID,Name,Link affiliate,Product image,Sets (optional)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Robust CSV split to handle quoted fields with commas
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      if (parts.length >= 5) {
        const name = parts[2].replace(/^"|"$/g, '').trim();
        const setIds: string[] = [];

        // Extract from 6th column if exists (comma or semicolon separated)
        // We also check all subsequent columns just in case the CSV isn't properly quoted
        for (let j = 5; j < parts.length; j++) {
          if (parts[j]) {
            const rawSets = parts[j].replace(/^"|"$/g, '');
            const columnSets = rawSets.split(/[;,]/).map(s => s.trim().toUpperCase());
            columnSets.forEach(id => {
              if (id && !setIds.includes(id)) setIds.push(id);
            });
          }
        }

        result.push({
          category: parts[0].replace(/^"|"$/g, '').trim(),
          id: parts[1].replace(/^"|"$/g, '').trim(),
          name: name,
          affiliateLink: parts[3].replace(/^"|"$/g, '').trim(),
          image: parts[4].replace(/^"|"$/g, '').trim(),
          setIds
        });
      }
    }
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        const parsedProducts = parseCSV(csvText);
        
        setProducts(parsedProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(parsedProducts.map(p => p.category)));
        setCategories(['All', ...uniqueCategories]);
      } catch (error) {
        console.error('Error fetching sheet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      // Check on window resize
      window.addEventListener('resize', checkScroll);
      
      // Also check after a short delay to account for rendering
      const timer = setTimeout(checkScroll, 100);
      
      return () => {
        scrollEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      
      if (!searchLower) return matchesCategory;

      // If search starts with H and is followed by numbers, prioritize Set ID
      const isOutfitSearch = /^h\d+$/i.test(searchLower);
      
      if (isOutfitSearch) {
        const matchesSet = product.setIds.some(id => id.toLowerCase() === searchLower);
        return matchesSet && matchesCategory;
      }

      const matchesSearch = product.name.toLowerCase().includes(searchLower) || 
                            product.id.toLowerCase().includes(searchLower) ||
                            product.setIds.some(id => id.toLowerCase().includes(searchLower));
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 font-sans">
      {/* Section 1: Profile & Contact Block */}
      <header className="max-w-2xl mx-auto mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[40px] p-6 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden chrome-border p-1 bg-white/20">
              <img 
                src="https://i.pinimg.com/1200x/04/2f/6a/042f6a54c4087c0bc7891a8aefdb0fb0.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold holographic-text mb-3 tracking-tight">
              @dieulusion
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <a href="mailto:dieulusion@gmail.com" className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity font-medium">
                <img 
                  src="https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/email-square-icon.png" 
                  alt="Mail" 
                  className="w-[18px] h-[18px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="holographic-text">dieulusion@gmail.com</span>
              </a>
              <a href="https://www.tiktok.com/@dieulusion" className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity font-medium">
                <img 
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/tiktok-rounded-square-icon.png" 
                  alt="TikTok" 
                  className="w-[18px] h-[18px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="holographic-text">TikTok</span>
              </a>
              <a href="https://www.lemon8-app.com/@dieulusion" className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity font-medium">
                <img 
                  src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/lemon8-icon.png" 
                  alt="Lemon8" 
                  className="w-[18px] h-[18px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="holographic-text">Lemon8</span>
              </a>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Section 2: Engagement CTA */}
      <section className="text-center mb-12">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base font-medium tracking-[0.2em] uppercase"
        >
          <span className="holographic-text">Follow mình để gặp lại trong những outfit tiếp theo nhé.</span>
        </motion.p>
      </section>

      {/* Section 3: Shopping Hub */}
      <section className="max-w-4xl mx-auto mb-12">
        <div className="mb-6 text-center">
          <div className="relative max-w-lg mx-auto">
            <input 
              type="text"
              placeholder="mã CODE theo CAPTION hoặc TÊN sản phẩm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-full glass-card border-white/40 focus:outline-none focus:border-purple-300 transition-all placeholder:text-[#483D8B]/40 text-[#483D8B] font-medium text-xs sm:text-sm text-center"
            />
          </div>
        </div>

        {/* Category Navigator */}
        <div className="relative group">
          <AnimatePresence>
            {showLeftArrow && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => scroll('left')}
                className="absolute left-0 top-[18px] -translate-y-1/2 z-20 text-[#483D8B] hover:scale-110 transition-all bg-white/95 shadow-lg rounded-full p-2 border border-white/50 cursor-pointer"
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
          </AnimatePresence>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar scroll-smooth"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                className={`px-6 py-2 rounded-full whitespace-nowrap text-sm transition-all duration-300 ${
                  selectedCategory === cat 
                  ? 'bg-white/40 border-white/80 shadow-lg font-bold' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 font-medium'
                } border backdrop-blur-md`}
              >
                <span className={selectedCategory === cat ? 'holographic-text' : ''}>
                  {cat}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showRightArrow && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => scroll('right')}
                className="absolute right-0 top-[18px] -translate-y-1/2 z-20 text-[#483D8B] hover:scale-110 transition-all bg-white/95 shadow-lg rounded-full p-2 border border-white/50 cursor-pointer"
              >
                <ChevronRight size={24} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Section 4: Catalog Sản phẩm */}
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-[30px] overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 md:p-6 space-y-3">
                  <div className="h-2 w-20 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-white/10 rounded" />
                </div>
              </div>
            ))
          ) : (
            <AnimatePresence mode='popLayout'>
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="glass-card rounded-[30px] overflow-hidden group cursor-pointer"
                  onClick={() => window.open(product.affiliateLink, '_blank')}
                >
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4 md:p-6">
                    <span className="text-[10px] uppercase tracking-widest block mb-1">
                      <span className="holographic-text opacity-60">{product.category} • {product.id}</span>
                    </span>
                    <h3 className="text-sm md:text-base font-semibold line-clamp-1 mb-2">
                      <span className="holographic-text">{product.name}</span>
                    </h3>
                    <div className="flex overflow-x-auto hide-scrollbar gap-1 pb-1 mask-fade-right max-w-[150px]">
                      {(() => {
                        const query = searchQuery.trim().toUpperCase();
                        const sortedSets = [...product.setIds].sort((a, b) => {
                          if (query && a.toUpperCase() === query) return -1;
                          if (query && b.toUpperCase() === query) return 1;
                          return 0;
                        });
                        
                        return sortedSets.map(setId => {
                          const isMatch = query && setId.toUpperCase() === query;
                          return (
                            <button 
                              key={setId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery(setId);
                                setSelectedCategory('All');
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded-md border border-[#483D8B]/20 transition-colors font-bold whitespace-nowrap flex-shrink-0 ${
                                isMatch 
                                  ? "bg-[#483D8B] text-white border-[#483D8B]" 
                                  : "bg-[#483D8B]/5 text-[#483D8B] hover:bg-[#483D8B]/10"
                              }`}
                            >
                              #{setId}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#483D8B]/60 italic font-medium">Không tìm thấy sản phẩm nào phù hợp...</p>
          </div>
        )}
      </main>

      <footer className="mt-20 text-center pb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase">
          <span className="holographic-text opacity-60">© 2026 dieulusion showcase</span>
        </p>
      </footer>
    </div>
  );
}
