# Simplificador De Texto

Es una herramienta web diseñada para mejorar la accesibilidad digital.  
Permite transformar textos complejos en español en versiones más claras y fáciles de entender, pensando específicamente en personas usuarias de **lectores de pantalla**.

## Tecnologías utilizadas

### Frontend
- React 
- Vite
- Tailwind CSS

### Backend
- Node.js + Express

### Base de datos
- PostgreSQL (hosteada en Supabase)

### Hosting
- Supabase (Backend y DB)

## Jerarquía de carpetas

```
frontend/
├── public/                     # Archivos copiados tal cual a la raíz del build final
├── src/                        # Código fuente principal de la aplicación
│   ├── assets/                 # Archivos estáticos procesados por Vite
│   ├── components/             # Piezas de UI reutilizables que no representan una página completa
│   ├── pages/                  # Vistas completas que corresponden a una ruta de la aplicación
│   ├── hooks/                  # Custom hooks que encapsulan lógica reutilizable
│   ├── context/                # Providers de React Context para estado global
│   ├── services/               # Funciones que se comunican con el backend
│   ├── utils/                  # Funciones puras sin dependencia de React
│   ├── App.jsx                 # Componente raíz, define el enrutamiento
│   └── main.jsx                # Punto de entrada del sistema
├── index.html                  # HTML principal de Vite
├── vite.config.js              # Configuración de Vite
└── package.json                # Dependencias y scripts del proyecto
```

backend


## Comandos importantes (Frontend)

Todos los comandos deben ejecutarse desde la carpeta `frontend/`.

| Comando           | Descripción                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `npm install`     | Instala todas las dependencias necesarias del frontend.                    |
| `npm run dev`     | Inicia el servidor de desarrollo de Vite (hot reload).                     |
| `npm run build`   | Empaqueta y optimiza todo el código del frontend para producción           |
---
