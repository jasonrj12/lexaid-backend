const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'lawyer-verifications';

async function setup() {
  console.log(`🚀 Setting up bucket: ${BUCKET_NAME}...`);

  // 1. Create the bucket if it doesn't exist
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (bucketError) {
    if (bucketError.message.includes('already exists')) {
      console.log('✅ Bucket already exists.');
    } else {
      console.error('❌ Error creating bucket:', bucketError.message);
      return;
    }
  } else {
    console.log('✅ Bucket created successfully.');
  }

  // 2. Double check it is set to public
  const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
    public: true
  });

  if (updateError) {
    console.error('❌ Error setting bucket to public:', updateError.message);
  } else {
    console.log('✅ Bucket access set to PUBLIC.');
  }

  console.log('\n🎉 Supabase Storage is ready for LexAid!');
}

setup();
