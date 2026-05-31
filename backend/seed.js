require('dotenv').config();
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('./supabase');

async function seed() {
  const EMAIL    = 'hermellahenok94@gmail.com';
  const PHONE    = '0986813121';
  const PASSWORD = process.env.OWNER_PASSWORD || 'Hermella2024';

  const { data: existing } = await supabase.from('users').select('id').eq('role', 'owner').single();
  if (existing) {
    // Update password every deploy so it always works
    const hash = bcrypt.hashSync(PASSWORD, 10);
    await supabase.from('users').update({ password: hash, email: EMAIL, phone: PHONE }).eq('role', 'owner');
    console.log('✅ Owner account refreshed');
  } else {
    const hash = bcrypt.hashSync(PASSWORD, 10);
    await supabase.from('users').insert({ id: uuidv4(), name: 'Hermella', email: EMAIL, phone: PHONE, password: hash, role: 'owner' });
    console.log('✅ Owner account created');
  }
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
