require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] ⚠️ Missing credentials (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY). Falling back to local storage for uploads.');
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Uploads a file to Supabase Storage
 * @param {Object} file - Express file object (multer)
 * @param {string} folder - Folder name in the bucket
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
async function uploadToSupabase(file, folder = 'verifications') {
  if (!supabase) return null;

  try {
    const fileContent = fs.readFileSync(file.path);
    const fileName = `${folder}/${Date.now()}-${file.filename}`;
    
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'lawyer-verifications')
      .upload(fileName, fileContent, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'lawyer-verifications')
      .getPublicUrl(fileName);

    // Cleanup local file
    try { fs.unlinkSync(file.path); } catch (e) { console.warn('Cleanup failed:', e.message); }

    return publicUrl;
  } catch (err) {
    console.error('[Supabase Upload Error]:', err.message);
    return null;
  }
}

module.exports = { supabase, uploadToSupabase };
