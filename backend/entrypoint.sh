#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput
# Demo data + demo user; set SEED_ON_START=0 to skip.
if [ "${SEED_ON_START:-1}" = "1" ]; then
  python manage.py seed
fi
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
