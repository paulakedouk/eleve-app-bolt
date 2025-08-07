-- Migration: Add organization_id to coaches table if not exists
-- Date: 2024-01-15

-- Add organization_id column to coaches table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'organization_id'
    ) THEN
        -- Add the column
        ALTER TABLE coaches ADD COLUMN organization_id UUID;
        
        -- Make it NOT NULL with a default value (you may need to adjust this based on your data)
        -- For now, we'll leave it nullable and you can update existing records manually
        -- ALTER TABLE coaches ALTER COLUMN organization_id SET NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE coaches ADD CONSTRAINT fk_coaches_organization_id 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_coaches_organization_id ON coaches(organization_id);
        
        RAISE NOTICE 'Added organization_id column to coaches table';
    ELSE
        RAISE NOTICE 'organization_id column already exists in coaches table';
    END IF;
END $$; 