import sharp from 'sharp';

sharp('static/img/logo.png')
  .resize(192)
  .toFile('static/img/logo-192x192.png');

sharp('static/img/logo.png')
  .resize(512)
  .toFile('static/img/logo-512x512.png');