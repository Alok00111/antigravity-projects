const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'client/public/avatars');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const animals = [
  '1f436', '1f431', '1f42d', '1f439', '1f430',
  '1f98a', '1f43b', '1f43c', '1f428', '1f42f',
  '1f981', '1f42e', '1f437', '1f438', '1f435',
  '1f414', '1f427', '1f426', '1f424', '1f984'
];

animals.forEach((code, i) => {
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;
  const dist = path.join(dir, `avatar_${i + 1}.svg`);
  https.get(url, (res) => {
    const file = fs.createWriteStream(dist);
    res.pipe(file);
    file.on('finish', () => file.close());
  });
});
console.log('Fetching 20 flat 2D animal avatars...');
