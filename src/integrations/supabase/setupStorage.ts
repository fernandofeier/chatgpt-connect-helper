
import { supabase } from "./client";

export const setupChatImagesBucket = async () => {
  try {
    // Check if the bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'chat_images');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('chat_images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Error creating chat_images bucket:', error);
        return;
      }
      
      console.log('Successfully created chat_images bucket');
      
      // Set public policy on the bucket through RPC instead of direct createPolicy
      // This is a workaround since createPolicy method doesn't exist
      try {
        // We'll make a direct query to set bucket to public
        const { error: policyError } = await supabase.rpc('set_bucket_public', { 
          bucket_name: 'chat_images'
        });
        
        if (policyError) {
          console.error('Error setting bucket to public:', policyError);
        }
      } catch (policyError) {
        console.error('Error setting bucket to public:', policyError);
        console.log('Continuing without setting bucket policy. You may need to set it manually in the Supabase dashboard.');
      }
    }
  } catch (error) {
    console.error('Error setting up chat_images bucket:', error);
  }
};
