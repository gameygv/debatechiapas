import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Home, Search, X, ChevronDown, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewsTicker from '../news/NewsTicker';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface Section {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, display_order')
        .order('display_order', { ascending: true });
      
      if (data) {
        setSections(data);
      }
    };
    fetchSections();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const VISIBLE_COUNT = 4;
  const visibleSections = sections.slice(0, VISIBLE_COUNT);
  const hiddenSections = sections.slice(VISIBLE_COUNT);

  return (
    <header className="flex flex-col border-b border-border bg-background relative">
      {/* Ticker Section */}
      <NewsTicker />

      {/* Main Header: Logo Image */}
      <div className="container mx-auto px-4 py-6 md:py-8 text-center relative">
        <Link to="/" className="inline-block group relative max-w-full">
          <img 
            src="/logo-debate.png"
            alt="Debate Chiapas"
            className="w-full h-auto md:w-auto md:h-28 mx-auto transition-transform group-hover:scale-105 object-contain"
          />
        </Link>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mt-4">
          <a
            href="https://www.facebook.com/MoyMontes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-[#fe4641] transition-colors transform hover:scale-110 duration-200"
            title="Facebook"
          >
            <Facebook size={24} />
          </a>
          <a
            href="https://www.instagram.com/moymontess/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-[#fe4641] transition-colors transform hover:scale-110 duration-200"
            title="Instagram"
          >
            <Instagram size={24} />
          </a>
          <a
            href="https://www.tiktok.com/@eldivodechiapas"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-[#fe4641] transition-colors transform hover:scale-110 duration-200"
            title="TikTok"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
          </a>
        </div>
        
        {/* Mobile Controls */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 md:hidden z-10 flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white hover:bg-gray-100 text-primary border-gray-300 shadow-md"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-8">
                <form onSubmit={handleSearch} className="mb-4 relative">
                  <Input 
                    placeholder="Buscar..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </form>

                <Link to="/" className="text-lg font-serif font-bold text-gray-800 flex items-center gap-2">
                  <Home size={18} /> INICIO
                </Link>
                {sections.map((section) => (
                  <Link 
                    key={section.id} 
                    to={`/categoria/${section.slug}`}
                    className="text-lg font-serif font-medium text-[#fe4641]"
                    onClick={() => document.body.click()} 
                  >
                    {section.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex justify-center border-t border-b border-[#fe4641]/30 bg-[#333333] shadow-md sticky top-0 z-50 min-h-[58px]">
        {showSearch ? (
          <div className="w-full max-w-3xl flex items-center px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2 items-center">
              <Search className="text-white h-5 w-5" />
              <input
                autoFocus
                type="text"
                placeholder="Escribe tu búsqueda y presiona Enter..."
                className="flex-1 bg-transparent border-none text-white placeholder:text-gray-400 focus:ring-0 text-lg outline-none font-serif"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSearch(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="container mx-auto px-4 flex items-center justify-between relative">
            {/* Centered Menu */}
            <ul className="flex-1 flex flex-wrap justify-center gap-x-8 gap-y-2 items-center">
              <li>
                <Link 
                  to="/"
                  className={`text-base font-serif font-bold tracking-wider transition-all duration-300 uppercase px-2 py-1 rounded-sm flex items-center gap-1 ${
                    location.pathname === '/' 
                      ? 'text-white border-b-2 border-[#fe4641]' 
                      : 'text-[#fe4641] hover:text-white hover:scale-110'
                  }`}
                >
                  <Home size={16} className="mb-0.5" /> INICIO
                </Link>
              </li>
              
              {visibleSections.map((section) => (
                <li key={section.id}>
                  <Link 
                    to={`/categoria/${section.slug}`}
                    className={`text-base font-serif font-bold tracking-wider transition-all duration-300 uppercase px-2 py-1 rounded-sm ${
                      location.pathname === `/categoria/${section.slug}` 
                        ? 'text-white border-b-2 border-[#fe4641]' 
                        : 'text-[#fe4641] hover:text-white hover:scale-110'
                    }`}
                  >
                    {section.name}
                  </Link>
                </li>
              ))}

              {hiddenSections.length > 0 && (
                <li>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-base font-serif font-bold tracking-wider text-[#fe4641] hover:text-white transition-all uppercase px-2 py-1 outline-none">
                      MÁS <ChevronDown size={14} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#333333] border-[#fe4641]/30 text-white min-w-[200px]">
                      {hiddenSections.map((section) => (
                        <DropdownMenuItem key={section.id} asChild className="focus:bg-[#fe4641] focus:text-white cursor-pointer">
                          <Link 
                            to={`/categoria/${section.slug}`}
                            className="w-full block font-serif font-medium uppercase tracking-wide"
                          >
                            {section.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              )}
            </ul>

            {/* Right Side Search Trigger */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSearch(true)}
                className="text-[#fe4641] hover:text-white hover:bg-white/10 transition-colors"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;