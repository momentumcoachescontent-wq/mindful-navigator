#!/bin/bash
echo "📦 Preparando el commit..."
git add .
git commit -m "fix(simulator): prevent white screen on analysis & use openai api key"
echo "🚀 Subiendo cambios a Lovable..."
git push
echo "✅ Cambios subidos. Lovable debería empezar el despliegue."
