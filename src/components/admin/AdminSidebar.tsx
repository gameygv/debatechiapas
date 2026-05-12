import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  Image, 
  Users, 
  Settings, 
  LogOut, 
  Megaphone, 
  ExternalLink,
  Sparkles,
  Shield,
  Menu,
  LayoutTemplate,
  User,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AUTHORS } from '@/data/mock-data';
import packageJson from '../../../package.json';

interface AdminSidebarProps {
  className?: string;
  onClose?: () => void;
}

const AdminSidebar = ({ className, onClose }: AdminSidebarProps) => {
  const [userRole, setUserRole] = useState<'superuser' | 'editor'>('editor');
  const [userName, setUserName] = useState(AUTHORS[0].name);

  useEffect(() => {
    // Fetch user role from Supabase
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setUserName(profile.full_name);
        }
      }
    };
    fetchUserRole();
  }, []);

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', roles: ['superuser', 'editor'] },
    { icon: FileText, label: 'Artículos', href: '/admin/articles', roles: ['superuser', 'editor'] },
    { icon: Menu, label: 'Secciones', href: '/admin/sections', roles: ['superuser', 'editor'] },
    { icon: Tags, label: 'Tags', href: '/admin/tags', roles: ['superuser'] },
    { icon: Image, label: 'Medios', href: '/admin/media', roles: ['superuser', 'editor'] },
    { icon: LayoutTemplate, label: 'Banners Home', href: '/admin/home-banners', roles: ['superuser', 'editor'] },
    { icon: HardDrive, label: 'Mantenimiento', href: '/admin/orphans', roles: ['superuser'] },
    { icon: Sparkles, label: 'Noticias IA', href: '/admin/news-ai', roles: ['superuser'] },
    { icon: Users, label: 'Usuarios', href: '/admin/users', roles: ['superuser'] },
    { icon: Megaphone, label: 'Anuncios', href: '/admin/ads', roles: ['superuser', 'editor'] },
    { icon: User, label: 'Mi Perfil', href: '/admin/profile', roles: ['superuser', 'editor'] },
    { icon: Settings, label: 'Ajustes', href: '/admin/settings', roles: ['superuser'] },
  ];

  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <aside className={cn("w-full h-full bg-gradient-to-b from-primary/5 to-accent/5 border-r border-sidebar-border flex flex-col bg-white", className)}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 bg-gradient-to-br from-primary to-accent rounded-sm flex items-center justify-center text-[10px] text-white font-bold">D</div>
          <span className="font-serif font-bold text-lg tracking-tight">DebateChiapas CMS IA</span>
        </div>
        <p className="text-xs text-muted-foreground ml-8">v {packageJson.version} Stable</p>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive 
                ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-l-2 border-primary" 
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
          >
            <item.icon size={18} />
            {item.label}
            {item.label === 'Noticias IA' && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">IA</Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate" title={userName}>{userName}</p>
            <div className="flex items-center gap-1 mt-1">
              {userRole === 'superuser' ? (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-primary to-accent">
                  <Shield className="h-2.5 w-2.5 mr-1" />
                  SuperUser
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Editor</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <NavLink to="/" target="_blank" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 text-xs border border-input bg-background hover:bg-accent h-8 rounded-md transition-colors">
              <ExternalLink size={14} />
              Ver Sitio
            </button>
          </NavLink>
          <button 
            onClick={handleLogout}
            className="h-8 w-8 flex items-center justify-center border border-input bg-background hover:bg-destructive hover:text-destructive-foreground hover:border-destructive rounded-md transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;