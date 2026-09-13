import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmlxuryvisemtwjkyrrw.supabase.co';
const key = process.env.SUPABASE_KEY || 'xbakz2aZR0Pf0Zqj';

console.log('Testing Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, key);

async function test() {
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  console.log('Result:', { data, error });
}

test();
