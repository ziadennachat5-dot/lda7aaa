const fs = require('fs');
const https = require('https');

const infCode = fs.readFileSync('influencers.js', 'utf8');
const INFLUENCERS = new Function(infCode + '; return INFLUENCERS;')();
console.log('influencers.js count:', INFLUENCERS.length, 'visible:', INFLUENCERS.filter(i => !i.hidden).length);

// Also test Supabase
const url = 'https://iqcuscahljfgbmpapemi.supabase.co/rest/v1/creators?select=*&visible=eq.true&order=sort_order.asc';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY3VzY2FobGpmZ2JtcGFwZW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNzQ3NTksImV4cCI6MjEwNzg1MDc1OX0.2wo2KFrQPADU50ZznghfrRcmLuuaKHyz_J92lDKpWd8';

const req = https.get(url, {
  headers: {
    'apikey': anonKey,
    'Authorization': 'Bearer ' + anonKey
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Supabase creators count:', Array.isArray(data) ? data.length : data);
    } catch (e) {
      console.log('Supabase response parse error:', e.message, body);
    }
  });
});
req.on('error', err => console.log('Supabase request error:', err.message));
