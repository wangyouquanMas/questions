#!/bin/bash

case "$1" in
  start)
    echo "Starting applications with PM2..."
    pm2 start ecosystem.config.js
    ;;
  stop)
    echo "Stopping all applications..."
    pm2 stop all
    ;;
  restart)
    echo "Restarting all applications..."
    pm2 restart all
    ;;
  reload)
    echo "Reloading all applications (zero-downtime)..."
    pm2 reload all
    ;;
  delete)
    echo "Deleting all applications from PM2..."
    pm2 delete all
    ;;
  logs)
    echo "Displaying logs (Ctrl+C to exit)..."
    pm2 logs
    ;;
  status)
    echo "Displaying application status..."
    pm2 status
    ;;
  monit)
    echo "Launching PM2 monitoring interface (Ctrl+C to exit)..."
    pm2 monit
    ;;
  save)
    echo "Saving PM2 configuration..."
    pm2 save
    ;;
  startup)
    echo "Setting up PM2 to start on system boot..."
    pm2 startup
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|reload|delete|logs|status|monit|save|startup}"
    exit 1
    ;;
esac

exit 0 