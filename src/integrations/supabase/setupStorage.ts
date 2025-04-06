
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
      try {
        const { error: createError } = await supabase.storage.createBucket('chat_images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB limit
        });
        
        if (createError) {
          console.error('Error creating chat_images bucket:', createError);
          
          // Check if it's a permissions/RLS error
          if (createError.message && createError.message.includes('row-level security policy')) {
            console.log('This appears to be a Row Level Security (RLS) policy error.');
            console.log('Please ensure the storage bucket can be created through the Supabase dashboard.');
          }
          
          return;
        }
        
        console.log('Successfully created chat_images bucket');
        
        // Note: Setting bucket policies needs to be done in the Supabase dashboard
        // or through SQL directly, as the JS client doesn't support this operation
        console.log('Note: You may need to set bucket policy manually in the Supabase dashboard');
      } catch (error) {
        console.error('Error creating chat_images bucket:', error);
        
        // This could happen due to permissions issues
        // Let the user know they may need to create the bucket manually
        console.log('You may need to create the chat_images bucket manually in the Supabase dashboard');
      }
    }
  } catch (error) {
    console.error('Error setting up chat_images bucket:', error);
  }
};
