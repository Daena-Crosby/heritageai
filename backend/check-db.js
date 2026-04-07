// Quick script to check recent stories and translations
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecent() {
  console.log('\n=== Recent Stories ===');
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (storiesError) {
    console.error('Error fetching stories:', storiesError);
    return;
  }

  console.log(`Found ${stories.length} recent stories:`);
  for (const story of stories) {
    console.log(`\n  Story: ${story.title}`);
    console.log(`  ID: ${story.id}`);
    console.log(`  Created: ${story.created_at}`);

    // Check translations for this story
    const { data: translations, error: transError } = await supabase
      .from('translations')
      .select('*')
      .eq('story_id', story.id);

    if (transError) {
      console.error('    Translation error:', transError);
    } else if (translations.length === 0) {
      console.log('    ❌ NO TRANSLATIONS FOUND');
    } else {
      const trans = translations[0];
      console.log(`    ✓ Translation exists:`);
      console.log(`      - Original text: ${trans.original_text ? `"${trans.original_text.substring(0, 50)}..."` : 'NULL'}`);
      console.log(`      - Translated text: ${trans.translated_text ? `"${trans.translated_text.substring(0, 50)}..."` : 'NULL'}`);
    }

    // Check processing jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('story_id', story.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!jobsError && jobs.length > 0) {
      const job = jobs[0];
      console.log(`    Job status: ${job.status} (${job.progress_pct}%)`);
      if (job.current_step) console.log(`    Current step: ${job.current_step}`);
      if (job.error_message) console.log(`    Error: ${job.error_message}`);
    }
  }

  console.log('\n');
  process.exit(0);
}

checkRecent().catch(console.error);
