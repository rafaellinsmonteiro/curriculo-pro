import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  const users = ['igorroocha2525@gmail.com', 'allanbbarros@hotmail.com'];
  
  for (const email of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: '123456',
      email_confirm: true
    });
    if (error) {
      console.error(`Error creating user ${email}:`, error.message);
    } else {
      console.log(`Successfully created user: ${email}`);
    }
  }
}

createUsers();
