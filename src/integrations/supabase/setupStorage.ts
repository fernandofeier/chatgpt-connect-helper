
import { supabase } from "./client";

export const setupChatImagesBucket = async () => {
  try {
    // Check if chat_images bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const chatImagesBucket = buckets?.find(bucket => bucket.name === 'chat_images');
    
    // If bucket doesn't exist, create it
    if (!chatImagesBucket) {
      const { error: createError } = await supabase.storage.createBucket('chat_images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
      
      if (createError) {
        console.error('Error creating chat_images bucket:', createError);
        return;
      }
      
      console.log('Successfully created chat_images bucket');
      
      // Set public policy on the bucket through RPC instead of direct createPolicy
      // This is a workaround since createPolicy method doesn't exist
      try {
        // We'll use console log instead of trying to call a non-existent method
        console.log('Note: You may need to set bucket policy manually in the Supabase dashboard');
      } catch (policyError) {
        console.error('Error setting bucket to public:', policyError);
        console.log('Continuing without setting bucket policy. You may need to set it manually in the Supabase dashboard.');
      }
    }
  } catch (error) {
    console.error('Error setting up chat_images bucket:', error);
  }
};
