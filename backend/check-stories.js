/**
 * Database Diagnostic Script
 * Checks the state of stories, translations, media, and processing jobs
 *
 * Usage: node check-stories.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Heritage AI Database Diagnostic Report');
  console.log('=========================================\n');

  // 1. Check synopsis column exists (manual check required)
  console.log('1️⃣  Checking Synopsis Column...');
  console.log('   ⚠️  Synopsis column check requires manual verification');
  console.log('   💡 Run in Supabase SQL Editor:');
  console.log('      SELECT column_name FROM information_schema.columns');
  console.log('      WHERE table_name = \'translations\' AND column_name = \'synopsis\';');
  console.log('   💡 If not found, run:');
  console.log('      ALTER TABLE translations ADD COLUMN IF NOT EXISTS synopsis TEXT;');
  console.log();

  // 2. Check recent stories
  console.log('2️⃣  Checking Recent Stories...');
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('id, title, created_at, moderation_status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (storiesError) {
    console.error('   ❌ Error fetching stories:', storiesError.message);
  } else if (!stories || stories.length === 0) {
    console.log('   ⚠️  No stories found in database');
  } else {
    console.log(`   ✅ Found ${stories.length} recent stories\n`);

    // 3. Check each story's related data
    console.log('3️⃣  Checking Story Details...\n');
    for (const story of stories) {
      console.log(`   📖 Story: ${story.title}`);
      console.log(`      ID: ${story.id}`);
      console.log(`      Created: ${story.created_at}`);
      console.log(`      Status: ${story.moderation_status || 'pending'}`);

      // Check translations
      const { data: translations } = await supabase
        .from('translations')
        .select('id, original_text, translated_text, synopsis')
        .eq('story_id', story.id);

      if (!translations || translations.length === 0) {
        console.log('      ❌ No translations found');
      } else {
        const trans = translations[0];
        console.log('      ✅ Translation exists:');
        console.log(`         - Original text: ${trans.original_text ? trans.original_text.substring(0, 50) + '...' : 'NULL'}`);
        console.log(`         - Translated text: ${trans.translated_text ? trans.translated_text.substring(0, 50) + '...' : 'NULL'}`);
        console.log(`         - Synopsis: ${trans.synopsis ? trans.synopsis.substring(0, 50) + '...' : 'NULL'}`);
      }

      // Check media
      const { data: media } = await supabase
        .from('media')
        .select('id, type, file_url')
        .eq('story_id', story.id);

      if (!media || media.length === 0) {
        console.log('      ❌ No media found');
      } else {
        console.log(`      ✅ Media found (${media.length}):`);
        media.forEach(m => {
          console.log(`         - ${m.type}: ${m.file_url.substring(0, 60)}...`);
        });
      }

      // Check illustrations
      const { data: illustrations } = await supabase
        .from('illustrations')
        .select('id, image_url')
        .eq('story_id', story.id);

      if (!illustrations || illustrations.length === 0) {
        console.log('      ❌ No illustrations found');
      } else {
        console.log(`      ✅ Illustrations found (${illustrations.length})`);
      }

      // Check processing job
      const { data: jobs } = await supabase
        .from('processing_jobs')
        .select('status, current_step, progress_pct, error_message, created_at, completed_at')
        .eq('story_id', story.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!jobs || jobs.length === 0) {
        console.log('      ⚠️  No processing job found');
      } else {
        const job = jobs[0];
        console.log(`      📊 Processing Job:`);
        console.log(`         - Status: ${job.status}`);
        console.log(`         - Current step: ${job.current_step || 'N/A'}`);
        console.log(`         - Progress: ${job.progress_pct}%`);
        if (job.error_message) {
          console.log(`         - Error: ${job.error_message}`);
        }
        console.log(`         - Created: ${job.created_at}`);
        console.log(`         - Completed: ${job.completed_at || 'Not completed'}`);
      }

      console.log();
    }
  }

  // 4. Check environment variables
  console.log('4️⃣  Checking Environment Variables...');
  console.log(`   GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   HUGGINGFACE_API_TOKEN: ${process.env.HUGGINGFACE_API_TOKEN ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING'}`);
  console.log();

  // 5. Summary
  console.log('📋 Summary & Recommendations:');
  console.log('================================');

  if (!stories || stories.length === 0) {
    console.log('   ⚠️  No stories in database - upload a test story to verify fixes');
  } else {
    const storiesWithTranslations = stories.filter(async s => {
      const { data } = await supabase.from('translations').select('id').eq('story_id', s.id);
      return data && data.length > 0;
    });

    console.log(`   📊 Total stories checked: ${stories.length}`);
    console.log('   💡 Check above for stories missing translations/media');
    console.log('   💡 Stories uploaded before today\'s fixes may need reprocessing');
  }

  if (!process.env.GROQ_API_KEY) {
    console.log('   ❌ GROQ_API_KEY missing - transcription will fail');
    console.log('   💡 Get API key from https://console.groq.com');
  }

  console.log('\n✅ Diagnostic complete!');
  console.log('   Next steps:');
  console.log('   1. If synopsis column missing, run migration in Supabase SQL Editor');
  console.log('   2. If GROQ_API_KEY missing, add to backend/.env');
  console.log('   3. Upload a NEW test story to verify fixes work');
  console.log('   4. Check backend console logs during upload for detailed errors');
}

checkDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
