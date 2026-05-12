import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Image as ImageIcon, Layers, Activity, MousePointer2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    articles: 0,
    media: 0,
    users: 0,
    sections: 0,
    adViews: 0,
    adClicks: 0
  });
  
  const [chartData, setChartData] = useState<{name: string, cantidad: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 0. Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (profile?.full_name) {
             const firstName = profile.full_name.split(' ')[0];
             setUserName(firstName);
          }
        }

        // 1. Obtener conteos exactos
        const { count: articlesCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
        const { count: mediaCount } = await supabase.from('media_files').select('*', { count: 'exact', head: true });
        const { count: sectionsCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        // 2. Obtener estadísticas de anuncios
        const { data: adsData } = await supabase.from('ads').select('views, clicks');
        const adViews = adsData?.reduce((sum, ad) => sum + (ad.views || 0), 0) || 0;
        const adClicks = adsData?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0;

        setStats({
          articles: articlesCount || 0,
          media: mediaCount || 0,
          users: profilesCount || 0,
          sections: sectionsCount || 0,
          adViews,
          adClicks
        });

        // 3. Obtener datos para la gráfica (Artículos por sección)
        const { data: categories } = await supabase.from('categories').select('id, name');
        const { data: articles } = await supabase.from('articles').select('category_id');

        if (categories && articles) {
          const statsByCat = categories.map(cat => {
            const count = articles.filter(a => a.category_id === cat.id).length;
            return {
              name: cat.name,
              cantidad: count
            };
          });
          
          // Ordenar por cantidad descendente, pero mostrar TODAS las secciones
          setChartData(statsByCat.sort((a, b) => b.cantidad - a.cantidad));
        }

      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, description, link, extra }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : value}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
          <span>{description}</span>
          {link && <Link to={link} className="text-primary hover:underline ml-2">Ver todo</Link>}
        </p>
        {extra && <div className="mt-2 pt-2 border-t text-xs">{extra}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">
          Hola, {userName || 'Colega'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bienvenido al panel de control. Aquí tienes el resumen de hoy.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Artículos Totales" 
          value={stats.articles} 
          icon={FileText} 
          description="Publicados y borradores"
          link="/admin/articles"
        />
        <StatCard 
          title="Rendimiento Anuncios" 
          value={stats.adViews.toLocaleString()}
          icon={Activity} 
          description="Vistas totales"
          link="/admin/ads"
          extra={
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Vistas</span>
              <span className="flex items-center gap-1 font-medium text-primary"><MousePointer2 className="w-3 h-3" /> {stats.adClicks} Clicks</span>
            </div>
          }
        />
        <StatCard 
          title="Usuarios" 
          value={stats.users} 
          icon={Users} 
          description="Editores registrados"
        />
        <StatCard 
          title="Secciones" 
          value={stats.sections} 
          icon={Layers} 
          description="Secciones activas"
          link="/admin/sections"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Contenido por Sección</CardTitle>
            <CardDescription>Distribución de artículos (incluso secciones vacías)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Altura dinámica: base 300px o 50px por barra si son muchas */}
            <div style={{ height: `${Math.max(300, chartData.length * 50)}px` }} className="w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{fontSize: 12}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: '4px' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                      label={{ position: 'right', fill: '#666', fontSize: 12 }}
                    >
                       {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {loading ? "Cargando datos..." : "No hay suficientes datos para mostrar la gráfica"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Acciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link to="/admin/articles/new">
                <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group mb-4">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Escribir nuevo artículo</p>
                    <p className="text-xs text-muted-foreground">Crear contenido desde cero</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/admin/media">
                <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Biblioteca de Medios</p>
                    <p className="text-xs text-muted-foreground">Subir y gestionar imágenes</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;