# Business Signup Migration Patch

After running the `fix-organizations-schema.sql` migration script, you need to update the business signup code to work with the new schema.

## Change Required in `screens/SignUpBusinessScreen.tsx`

**Replace this code:**
```typescript
// Create organization first
console.log('Creating organization...');
const { data: orgData, error: orgError } = await supabase
  .from('organizations')
  .insert({
    name: formData.businessName.trim(),
    owner_id: authData.user.id,
    subscription_plan: 'free',
  })
  .select()
  .single();
```

**With this code:**
```typescript
// Create organization first
console.log('Creating organization...');
const { data: orgData, error: orgError } = await supabase
  .from('organizations')
  .insert({
    name: formData.businessName.trim(),
    slug: formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
  })
  .select()
  .single();
```

## Also Update `types/database.ts`

**Replace the organizations type:**
```typescript
organizations: {
  Row: {
    id: string;
    name: string;
    owner_id: string;
    subscription_plan: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    owner_id: string;
    subscription_plan?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    owner_id?: string;
    subscription_plan?: string;
    created_at?: string;
    updated_at?: string;
  };
};
```

**With:**
```typescript
organizations: {
  Row: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    slug: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    slug?: string;
    created_at?: string;
    updated_at?: string;
  };
};
```

## Migration Steps

1. **Run the migration first** in your Supabase SQL Editor:
   ```sql
   -- Copy and run the contents of fix-organizations-schema.sql
   ```

2. **Then apply the code changes** above to your TypeScript files

3. **Test the business signup** - it should work without the owner_id error 