# GraphicAI - React Flow Management Platform

Plataforma completa de gestión de diagramas de React Flow con autenticación y persistencia en Supabase.

## 🚀 Características

- ✅ **Autenticación**: Sistema completo con Supabase Auth (login/registro)
- ✅ **Base de Datos**: PostgreSQL con Supabase
- ✅ **React Flow**: Diagrama interactivo con nodos personalizados
- ✅ **Dashboard**: Gestión de múltiples diagramas
- ✅ **Editor**: Editor visual con guardado automático
- ✅ **UI Moderna**: Glassmorphism, dark mode, animaciones
- ✅ **Row Level Security**: Seguridad a nivel de fila con RLS

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/graphicai.git
cd graphicai
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. En el dashboard de Supabase, ir a **SQL Editor**
3. Ejecutar el script de migración: `supabase/migrations/001_initial_schema.sql`
4. Obtener credenciales en **Settings → API**

### 4. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# Editar .env y configurar:
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 🗂️ Estructura del Proyecto

```
graphicai/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Página de login
│   │   └── register/page.tsx       # Página de registro
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx      # Dashboard principal
│   │   ├── flow/[id]/page.tsx      # Editor de flujo
│   │   └── layout.tsx              # Layout del dashboard
│   ├── api/
│   │   ├── auth/                   # APIs de autenticación
│   │   ├── register/               # API de registro
│   │   └── flows/                  # APIs de flujos
│   ├── layout.tsx                  # Layout raíz
│   ├── page.tsx                    # Página principal
│   └── globals.css                 # Estilos globales
├── components/
│   └── flow/
│       └── FlowDiagram.tsx         # Componente principal de React Flow
├── lib/
│   └── supabase/
│       ├── client.ts               # Cliente de Supabase (browser)
│       ├── server.ts               # Cliente de Supabase (server)
│       ├── middleware.ts           # Helper de middleware
│       └── database.types.ts       # Tipos TypeScript
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Esquema de base de datos
├── .agent/
│   └── workflows/
│       ├── ui-reviewer.md          # Agente revisor de UI
│       └── ui-implementer.md       # Agente implementador de UI
├── middleware.ts                   # Middleware de autenticación
└── package.json                    # Dependencias
```

## 🎨 Componentes Principales

### FlowDiagram
Componente completo que incluye:
- Nodos personalizados (LLM, MCP, Client, Error)
- Detección de patrones arquitectónicos
- Sidebar de detalles de nodos
- Modo fullscreen
- Guardado automático en Supabase

### Dashboard
- Lista de diagramas del usuario
- Creación de nuevos diagramas
- Eliminación de diagramas
- Navegación al editor

### Editor
- Carga de datos del diagrama desde Supabase
- Integración con FlowDiagram
- Guardado automático
- Navegación de regreso al dashboard

## 🔐 Autenticación

El sistema usa Supabase Auth con:
- Autenticación por email/password
- Sesiones manejadas automáticamente
- Middleware para rutas protegidas
- Row Level Security (RLS) en la base de datos

## 💾 Base de Datos

Esquema PostgreSQL:
- **flows**: Diagramas de flujo (con RLS)
- **flow_data**: Datos de nodos y edges en JSONB (con RLS)

Las políticas RLS aseguran que cada usuario solo pueda acceder a sus propios datos.

## 🤖 Agentes UI/UX

El proyecto incluye workflows para mejorar la estética:

- `/ui-reviewer` - Analiza componentes y genera plan de mejoras
- `/ui-implementer` - Ejecuta el plan de mejoras

Ver `.agent/workflows/README.md` para más detalles.

## 🎯 Primeros Pasos

1. Registrar un usuario en `/register`
2. Iniciar sesión en `/login`
3. Crear un nuevo diagrama desde el dashboard
4. Editar el diagrama en el editor
5. Los cambios se guardan automáticamente en Supabase

## 📝 Notas

- El proyecto usa PostgreSQL vía Supabase
- Row Level Security (RLS) protege los datos de cada usuario
- Los estilos están optimizados para dark mode
- Ver `SUPABASE_SETUP.md` para instrucciones detalladas de configuración

## 🛠️ Tecnologías

- **Next.js 15** - Framework de React
- **React Flow** - Diagramas interactivos
- **Supabase** - Backend (Auth + PostgreSQL)
- **Tailwind CSS** - Estilos
- **TypeScript** - Tipado
- **Framer Motion** - Animaciones
- **Lucide React** - Iconos

## 📚 Documentación Adicional

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guía de configuración de Supabase
- [.agent/workflows/README.md](./.agent/workflows/README.md) - Agentes UI/UX

## 🚀 Despliegue

### Vercel (Recomendado)

1. Push a GitHub
2. Importar proyecto en [vercel.com](https://vercel.com)
3. Configurar variables de entorno
4. Deploy automático

### Variables de Entorno en Producción

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 📄 Licencia

MIT
