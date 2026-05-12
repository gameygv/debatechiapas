import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('categories')
                .select('id, name, slug')
                .order('display_order', { ascending: true })
                .limit(6); 
            
            if (data) {
                setCategories(data);
            }
        };
        fetchCategories();
    }, []);

    return (
        <footer className="bg-[#002244] text-white border-t border-[#FF7A59]/30 mt-8">
            {/* Logo Strip */}
            <div className="w-full border-b border-white/10 py-6 bg-[#ffffff]">
                <img
                    src="/FooterMoyMontes.jpg"
                    alt="Debate Chiapas"
                    className="h-32 md:h-40 w-auto mx-auto object-contain" />
            </div>
            
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <h2 className="font-serif text-2xl font-bold text-[#FF7A59]">Debate Chiapas</h2>
                        <p className="text-sm text-gray-300 leading-relaxed font-sans">
                            Periodismo independiente, crítico y veraz desde el corazón del sureste mexicano. Debate Chiapas.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a
                                href="https://www.facebook.com/MoyMontes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#FF7A59] transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a
                                href="https://www.instagram.com/moymontess/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#FF7A59] transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a
                                href="https://www.tiktok.com/@eldivodechiapas"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-[#FF7A59] transition-colors">
                                {/* Custom TikTok Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round">
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Sections Column */}
                    <div>
                        <h3 className="font-serif text-lg font-semibold mb-4 text-[#FF7A59]">Secciones</h3>
                        <ul className="space-y-2 font-sans text-sm">
                            {categories.map(cat => (
                                <li key={cat.id}>
                                    <Link
                                        to={`/categoria/${cat.slug}`}
                                        className="text-gray-300 hover:text-[#FF7A59] transition-colors hover:underline uppercase tracking-wide">
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Institutional Column */}
                    <div>
                        <h3 className="font-serif text-lg font-semibold mb-4 text-[#FF7A59]">Institucional</h3>
                        <ul className="space-y-2 font-sans text-sm text-gray-300">
                            <li className="hover:text-[#FF7A59] transition-colors cursor-default">Quiénes Somos</li>
                            <li className="hover:text-[#FF7A59] transition-colors cursor-default">Contacto</li>
                            <li className="hover:text-[#FF7A59] transition-colors cursor-default">Publicidad</li>
                            <li className="hover:text-[#FF7A59] transition-colors cursor-default">Aviso de Privacidad</li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-white/10 mt-12 pt-8 text-center text-xs text-gray-400 font-sans">
                    © {currentYear} - Debate Chiapas. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
};

export default Footer;