const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://zsougvzcbnravctjqhoa.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.log('ERROR: Need SUPABASE_SERVICE_ROLE_KEY env var.');
  console.log('Find it in Supabase Dashboard > Settings > API > service_role key');
  console.log('Then run: set SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('And re-run: node run-migration.js');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = fs.readFileSync('supabase-daily-hands.sql', 'utf-8');

async function run() {
  console.log('Running migration...');
  const { data, error } = await supabase.rpc('', {}).then(() => null).catch(() => null);
  
  // Use the SQL directly via postgREST won't work for DDL
  // Instead use the management API
  const resp = await fetch(`${url}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('This approach wont work for DDL statements.');
  console.log('');
  console.log('The simplest way is to paste the SQL into the Supabase SQL Editor.');
  console.log('Let me copy it to your clipboard instead...');
}

// Just copy to clipboard using PowerShell
const { execSync } = require('child_process');
try {
  execSync('powershell -command "Get-Content supabase-daily-hands.sql | Set-Clipboard"', { cwd: __dirname });
  console.log('SUCCESS: SQL migration copied to your clipboard!');
  console.log('');
  console.log('Now:');
  console.log('1. Go to the Supabase SQL Editor tab in your browser');
  console.log('2. Click in the editor area');
  console.log('3. Press Ctrl+A to select all (clear old query)');
  console.log('4. Press Ctrl+V to paste');
  console.log('5. Click the green "Run" button (or press Ctrl+Enter)');
  console.log('');
  console.log('Thats it! The migration creates all the tables needed for Play mode.');
} catch (e) {
  console.log('Could not copy to clipboard. Opening the file instead...');
  execSync('notepad supabase-daily-hands.sql');
}
