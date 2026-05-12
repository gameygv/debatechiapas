# El Divo de Chiapas — Diario CMS

Plataforma de noticias full-stack diseñada para Moy Montes con sistema de roles y generación de contenido con IA.

## Stack Tecnológico
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **IA**: OpenAI GPT-4 + DALL-E 3
- **Búsqueda**: DuckDuckGo API

## Sistema de Roles

### SuperUser
- Acceso completo a todas las funciones
- Puede crear y gestionar usuarios
- Acceso a herramientas de IA
- Configuración del sistema
- **Usuario inicial**: Gamey García Varela (gameygv@gmail.com)

### Editor
- Crear y editar artículos
- Subir medios
- Ver categorías
- Sin acceso a configuración ni usuarios

## Configuración Inicial

### 1. Crear el primer SuperUser en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Authentication → Users → Add User
3. Completa los datos:
   - Email: tu email de administrador
   - Password: una contraseña segura (mínimo 12 caracteres)
   - Confirm Email: ✓ (activado)
4. En "User Metadata" agrega:
   ```json
   {
     "full_name": "Tu Nombre",
     "role": "superuser"
   }
   ```

### 2. Configurar APIs de OpenAI

Para usar la funcionalidad de generación de noticias con IA, necesitas:

1. **API Key de OpenAI**:
   - Regístrate en https://platform.openai.com
   - Crea una API key en API Keys section
   - Guarda la key en Supabase:
     - Project Settings → Edge Functions → Secrets
     - Nombre: `OPENAI_API_KEY`
     - Valor: tu API key

2. **Modelos requeridos**:
   - GPT-4 (para reescribir noticias)
   - DALL-E 3 (para generar imágenes)

### 3. Configurar DuckDuckGo Search

La búsqueda de noticias usa la API gratuita de DuckDuckGo:
- No requiere API key
- Endpoint: `https://api.duckduckgo.com/`
- Límite: Uso razonable (no especificado)

## Funcionalidades Principales

### 1. Gestión de Usuarios (Solo SuperUser)
- Crear usuarios con rol Editor o SuperUser
- Editar información y contraseñas
- No hay recuperación de contraseña por email
- Acceso: `/admin/users`

### 2. Generador de Noticias con IA (Solo SuperUser)
- Busca noticias por palabra clave
- Reescribe contenido con GPT-4
- Genera imagen destacada con DALL-E
- Publica directamente al blog
- Acceso: `/admin/news-ai`

### 3. Sistema de Autenticación
- Login solo por URL: `/login`
- Sin registro público
- Sin recuperación de contraseña
- Sesión persistente

## Automatizaciones

### Publicación a Redes Sociales (vía Webhook)
Cuando un artículo se publica, el sistema envía un payload JSON a Make.com.

**Configuración en Make.com:**
1. Crear escenario con trigger "Custom Webhook"
2. Copiar la URL del webhook en `/admin/settings`
3. Conectar módulos de Facebook, Telegram, Twitter/X

### Publicar por Email
Envía correos para crear borradores automáticamente.
- Asunto: Título del artículo
- Cuerpo: Contenido
- Adjuntos: Primera imagen = portada

## Estructura de Base de Datos

```sql
-- Tabla de perfiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enum de roles
CREATE TYPE user_role AS ENUM ('superuser', 'editor');
```

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de acceso basadas en roles
- Autenticación JWT con Supabase
- Validación de permisos en frontend y backend

## Despliegue

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Supabase)
- Ya está desplegado en la nube
- Edge Functions se despliegan automáticamente

## Soporte

Para problemas o preguntas:
- Email: gameygv@gmail.com
- Sistema: El Divo de Chiapas CMS v1.0.0