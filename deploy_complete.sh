#!/bin/bash

# Script de Despliegue Automatizado para 'analyze-situation'
# Este script resuelve los problemas comunes de autenticación y rutas.

echo "🚀 Iniciando proceso de despliegue..."

# 1. Login (Si el token expiró)
echo "🔑 Paso 1: Verificando Sesión..."
npx supabase login

# 2. Link al Proyecto (Para asegurar que apuntamos a la nube correcta)
echo "🔗 Paso 2: Vinculando proyecto..."
npx supabase link --project-ref dcncnrlbwvknssanwlgp

# 3. Despliegue de la Función (Usando el NOMBRE de la función, no la ruta)
echo "☁️  Paso 3: Desplegando función 'analyze-situation'..."
npx supabase functions deploy analyze-situation --no-verify-jwt

echo "✅ Proceso finalizado. Si no hubo errores rojos arriba, la moderación está activa."
