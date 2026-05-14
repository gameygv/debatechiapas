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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, display_order')
        .order('display_order', { ascending: true });
      if (data) setSections(data);
    };
    fetchSections();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const VISIBLE_COUNT = 6;
  const visibleSections = sections.slice(0, VISIBLE_COUNT);
  const hiddenSections = sections.slice(VISIBLE_COUNT);

  return (
    <header className="flex flex-col relative">
      {/* Ticker */}
      <NewsTicker />

      {/* Logo Banner — full-width red background like the original */}
      <div className="w-full bg-gradient-to-b from-[#b71c1c] to-[#c62828] py-6 md:py-8">
        <Link to="/" className="block max-w-3xl mx-auto px-4">
          <img
            src="/logo-debate.png"
            alt="Debate Chiapas"
            className="w-full h-auto mx-auto object-contain drop-shadow-lg"
          />
        </Link>
      </div>

      {/* Search Bar + Social — like the original */}
      <div className="bg-[#f5f5f5] border-b border-gray-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Social Icons */}
          <div className="hidden md:flex items-center gap-4">
            <a href="https://www.facebook.com/MoyMontes" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#fe4641] transition-colors" title="Facebook">
              <Facebook size={20} />
            </a>
            <a href="https://www.instagram.com/moymontess/" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#fe4641] transition-colors" title="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://www.tiktok.com/@eldivodechiapas" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#fe4641] transition-colors" title="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full border border-gray-300 rounded px-4 py-2 pr-10 text-sm bg-white focus:outline-none focus:border-[#fe4641] font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#fe4641]">
              <Search size={16} />
            </button>
          </form>

          <div className="hidden md:block w-20" />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#333333] shadow-md sticky top-0 z-50">
        {/* Desktop */}
        <div className="hidden md:flex container mx-auto px-4 items-center justify-center min-h-[48px]">
          <ul className="flex flex-wrap justify-center gap-x-1 items-center">
            <li>
              <Link
                to="/"
                className={`text-sm font-sans font-semibold tracking-wide uppercase px-4 py-3 inline-flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/'
                    ? 'text-white bg-[#fe4641]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home size={14} /> Inicio
              </Link>
            </li>
            {visibleSections.map((section) => (
              <li key={section.id}>
                <Link
                  to={`/categoria/${section.slug}`}
                  className={`text-sm font-sans font-semibold tracking-wide uppercase px-4 py-3 inline-block transition-colors ${
                    location.pathname === `/categoria/${section.slug}`
                      ? 'text-white bg-[#fe4641]'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {section.name}
                </Link>
              </li>
            ))}
            {hiddenSections.length > 0 && (
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-sm font-sans font-semibold tracking-wide uppercase px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 inline-flex items-center gap-1 outline-none">
                    Mas <ChevronDown size={12} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#333333] border-gray-600 text-white min-w-[180px]">
                    {hiddenSections.map((section) => (
                      <DropdownMenuItem key={section.id} asChild className="focus:bg-[#fe4641] focus:text-white cursor-pointer">
                        <Link to={`/categoria/${section.slug}`} className="w-full block font-sans text-sm uppercase tracking-wide">
                          {section.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )}
          </ul>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between px-4 min-h-[48px]">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
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
                <Link to="/" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Home size={18} /> INICIO
                </Link>
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    to={`/categoria/${section.slug}`}
                    className="text-lg font-medium text-[#fe4641]"
                    onClick={() => document.body.click()}
                  >
                    {section.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <span className="text-white font-bold text-sm uppercase tracking-wide">Debate Chiapas</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"
            onClick={() => navigate('/buscar')}>
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
