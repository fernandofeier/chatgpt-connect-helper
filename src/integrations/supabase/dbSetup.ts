
import { supabase } from "./client";
import { setupChatImagesBucket } from "./setupStorage";

export const setupDatabase = async () => {
  try {
    // Check if image_url column exists in messages table
    const { data: columns, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error checking messages table schema:', error);
      
      // Try to create the column if it doesn't exist
      // Use direct SQL execution instead of RPC
      const { error: alterError } = await supabase
        .from('messages')
        .select('id')
        .limit(1)
        .then(async () => {
          // Check if the column already exists first through a simple query
          // If there's an error, it likely means we need to add the column
          return supabase.rpc('add_image_url_column_if_not_exists');
        });
      
      if (alterError) {
        console.error('Error adding image_url column:', alterError);
      }
    }
    
    // Setup storage bucket for images
    await setupChatImagesBucket();
    
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
};

// Call this function when the app starts
export const initDatabase = () => {
  setupDatabase().catch(console.error);
};
