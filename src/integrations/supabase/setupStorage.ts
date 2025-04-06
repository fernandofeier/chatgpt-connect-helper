
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
      
      // Set up bucket public policy
      const { error: policyError } = await supabase.storage.from('chat_images').createPolicy('Public Read Policy', {
        type: 'read',
        name: 'Public Read Policy',
        definition: "true" // Make all files readable by anyone
      });
      
      if (policyError) {
        console.error('Error creating public read policy:', policyError);
      }
    }
  } catch (error) {
    console.error('Error setting up chat_images bucket:', error);
  }
};
