#!/bin/bash

# Script de Despliegue Masivo (Fix 500s)
# Despliega TODAS las funciones necesarias para que el frontend no falle.

echo "🚀 Iniciando despliegue de funciones críticas..."

# 1. Login y Link (por si acaso)
npx supabase login
npx supabase link --project-ref dcncnrlbwvknssanwlgp

# 2. Desplegar analyze-situation (Moderación)
echo "☁️  Desplegando analyze-situation..."
npx supabase functions deploy analyze-situation --no-verify-jwt

# 3. Desplegar check-subscription (Suscripciones - Causa del error 500)
echo "☁️  Desplegando check-subscription..."
npx supabase functions deploy check-subscription --no-verify-jwt

# 4. Desplegar otras funciones útiles (opcional pero recomendado)
echo "☁️  Desplegando send-sos-email..."
npx supabase functions deploy send-sos-email --no-verify-jwt

echo "✅ Todas las funciones desplegadas. El error 500 debería desaparecer."
