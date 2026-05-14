import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

// Public Pages
import Index from "./pages/Index";
import ArticleDetail from "./pages/ArticleDetail";
import Login from "./pages/Login";
import SearchResults from "./pages/SearchResults";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Articles from "./pages/admin/Articles";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Sections from "./pages/admin/Sections";
import Tags from "./pages/admin/Tags";
import MediaLibrary from "./pages/admin/MediaLibrary";
import Integrations from "./pages/admin/Integrations";
import Users from "./pages/admin/Users";
import NewsAI from "./pages/admin/NewsAI";
import Ads from "./pages/admin/Ads";
import HomeBanners from "./pages/admin/HomeBanners";
import Profile from "./pages/admin/Profile";
import OrphanCleaner from "./pages/admin/OrphanCleaner";

// Edition Pages (lazy for bundle splitting - pdfjs is heavy)
import EditionArchive from "./pages/EditionArchive";
import DailyEditions from "./pages/admin/DailyEditions";
const EditionViewer = React.lazy(() => import("./pages/EditionViewer"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min antes de refetch
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente auxiliar para redirigir enlaces cortos
const RedirectLegacyLink = () => {
  const { slug } = useParams();
  // Redirige /s/:slug -> /noticias/:slug
  return <Navigate to={`/noticias/${slug}`} replace />;
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Helmet>
          <title>Debate Chiapas</title>
          <meta name="description" content="Noticias, política y análisis desde el sureste mexicano." />
          
          {/* Default Open Graph (Home Page & General) */}
          <meta property="og:site_name" content="Debate Chiapas" />
          <meta property="og:title" content="Debate Chiapas" />
          <meta property="og:description" content="Noticias, política y análisis desde el sureste mexicano." />
          {/* Absolute URL is critical for WhatsApp/Facebook */}
          <meta property="og:image" content="https://debatechiapas.dockerapps.top/debate-og.jpg" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://debatechiapas.dockerapps.top/" />
          
          {/* Default Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://debatechiapas.dockerapps.top/debate-og.jpg" />
        </Helmet>

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/noticias/:slug" element={<ArticleDetail />} />
          
          {/* COMPATIBILIDAD: Redirección automática para enlaces antiguos /s/ */}
          <Route path="/s/:slug" element={<RedirectLegacyLink />} />
          
          <Route path="/categoria/:slug" element={<Index />} />
          <Route path="/buscar" element={<SearchResults />} />
          <Route path="/ediciones" element={<EditionArchive />} />
          <Route path="/edicion/:id" element={
            <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <EditionViewer />
            </React.Suspense>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/new" element={<ArticleEditor />} />
            <Route path="articles/edit/:id" element={<ArticleEditor />} />
            <Route path="sections" element={<Sections />} />
            <Route path="tags" element={<Tags />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="orphans" element={<OrphanCleaner />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="news-ai" element={<NewsAI />} />
            <Route path="ads" element={<Ads />} />
            <Route path="home-banners" element={<HomeBanners />} />
            <Route path="daily-editions" element={<DailyEditions />} />
            <Route path="settings" element={<Integrations />} />
            <Route path="*" element={<div className="p-10">Página en construcción</div>} />
          </Route>

          {/* Catch-all: Redirige a Home en lugar de mostrar 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;