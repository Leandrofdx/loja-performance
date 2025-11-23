#!/bin/sh
set -e

echo "⏳ Aguardando PostgreSQL (15 segundos)..."
sleep 15
echo "✅ PostgreSQL pronto!"

# Executar setup apenas se for o comando gunicorn (não para worker/celery)
if [ "$1" = "gunicorn" ]; then
  echo "🚀 Executando setup inicial..."
  python manage.py init_store
  echo "✅ Setup concluído! Iniciando servidor..."
fi

# Executar comando original
exec "$@"

