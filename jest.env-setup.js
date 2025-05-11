const fs = require('fs');
console.log('Finns .env:', fs.existsSync('.env'));
console.log('Finns .env.test:', fs.existsSync('.env.test'));
if (fs.existsSync('.env')) {
  console.log('Innehåll .env:', fs.readFileSync('.env', 'utf8'));
}
if (fs.existsSync('.env.test')) {
  console.log('Innehåll .env.test:', fs.readFileSync('.env.test', 'utf8'));
}
require('dotenv').config({ path: '.env' });
console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
Object.keys(process.env)
  .filter(k => k.startsWith('EXPO_'))
  .forEach(k => console.log('process.env:', k, '=', JSON.stringify(process.env[k]))); 