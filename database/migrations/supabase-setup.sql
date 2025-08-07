-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('business', 'admin', 'coach', 'student', 'parent');
CREATE TYPE skill_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE upload_status AS ENUM ('pending', 'uploading', 'uploaded', 'failed');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- Create organizations table
CREATE TABLE organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_plan subscription_plan DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'business',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role user_role NOT NULL CHECK (role != 'business'),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    level skill_level DEFAULT 'Beginner',
    age INTEGER NOT NULL CHECK (age > 0 AND age < 100),
    profile_image TEXT,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    environment TEXT NOT NULL,
    environment_name TEXT NOT NULL,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_students join table
CREATE TABLE session_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Create videos table
CREATE TABLE videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    trick_name TEXT,
    landed BOOLEAN DEFAULT FALSE,
    duration INTEGER, -- in seconds
    comment TEXT,
    has_voice_note BOOLEAN DEFAULT FALSE,
    upload_status upload_status DEFAULT 'pending',
    upload_progress INTEGER DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_students join table
CREATE TABLE video_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(video_id, student_id)
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Organizations policies
CREATE POLICY "Organizations are viewable by members" ON organizations
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.organization_id = organizations.id 
            AND profiles.id = auth.uid()
        )
    );

CREATE POLICY "Organizations can be created by authenticated users" ON organizations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organizations can be updated by owner" ON organizations
    FOR UPDATE USING (owner_id = auth.uid());

-- Profiles policies
CREATE POLICY "Profiles are viewable by organization members" ON profiles
    FOR SELECT USING (
        id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Invitations policies
CREATE POLICY "Invitations are viewable by organization admins and business owners" ON invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

CREATE POLICY "Invitations can be created by admins and business owners" ON invitations
    FOR INSERT WITH CHECK (
        invited_by = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

CREATE POLICY "Invitations can be updated by admins and business owners" ON invitations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

-- Students policies
CREATE POLICY "Students are viewable by their coach and organization members" ON students
    FOR SELECT USING (
        coach_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Students can be created by coaches" ON students
    FOR INSERT WITH CHECK (
        coach_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
    );

CREATE POLICY "Students can be updated by their coach" ON students
    FOR UPDATE USING (coach_id = auth.uid());

-- Sessions policies
CREATE POLICY "Sessions are viewable by coach and organization members" ON sessions
    FOR SELECT USING (
        coach_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Sessions can be created by coaches" ON sessions
    FOR INSERT WITH CHECK (
        coach_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
    );

CREATE POLICY "Sessions can be updated by their coach" ON sessions
    FOR UPDATE USING (coach_id = auth.uid());

-- Session_students policies
CREATE POLICY "Session students are viewable by coach and organization members" ON session_students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_students.session_id 
            AND (
                sessions.coach_id = auth.uid() OR 
                sessions.organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Session students can be managed by session coach" ON session_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_students.session_id 
            AND sessions.coach_id = auth.uid()
        )
    );

-- Videos policies
CREATE POLICY "Videos are viewable by coach and organization members" ON videos
    FOR SELECT USING (
        coach_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = videos.session_id 
            AND sessions.organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Videos can be created by coaches" ON videos
    FOR INSERT WITH CHECK (
        coach_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
    );

CREATE POLICY "Videos can be updated by their coach" ON videos
    FOR UPDATE USING (coach_id = auth.uid());

-- Video_students policies
CREATE POLICY "Video students are viewable by coach and organization members" ON video_students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos 
            WHERE videos.id = video_students.video_id 
            AND (
                videos.coach_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM sessions 
                    WHERE sessions.id = videos.session_id 
                    AND sessions.organization_id IN (
                        SELECT organization_id FROM profiles WHERE id = auth.uid()
                    )
                )
            )
        )
    );

CREATE POLICY "Video students can be managed by video coach" ON video_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM videos 
            WHERE videos.id = video_students.video_id 
            AND videos.coach_id = auth.uid()
        )
    );

-- Storage policies
CREATE POLICY "Video files are accessible by coach and organization members" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'videos' AND 
        (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.organization_id IN (
                    SELECT organization_id FROM profiles 
                    WHERE id = ((storage.foldername(name))[1])::uuid
                )
            )
        )
    );

CREATE POLICY "Video files can be uploaded by coaches" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'videos' AND 
        (storage.foldername(name))[1] = auth.uid()::text AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
    );

-- Similar policies for thumbnails and avatars
CREATE POLICY "Thumbnail files are accessible by coach and organization members" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'thumbnails' AND 
        (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.organization_id IN (
                    SELECT organization_id FROM profiles 
                    WHERE id = ((storage.foldername(name))[1])::uuid
                )
            )
        )
    );

CREATE POLICY "Thumbnail files can be uploaded by coaches" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails' AND 
        (storage.foldername(name))[1] = auth.uid()::text AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
    );

CREATE POLICY "Avatar files are accessible by organization members" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'avatars' AND 
        (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.organization_id IN (
                    SELECT organization_id FROM profiles 
                    WHERE id = ((storage.foldername(name))[1])::uuid
                )
            )
        )
    );

CREATE POLICY "Avatar files can be uploaded by users" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Create function to automatically create role-specific record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
    org_id UUID;
BEGIN
    -- Get role from user metadata
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- Default to 'business' if no role specified
    IF user_role IS NULL THEN
        user_role := 'business';
    END IF;
    
    -- For business users, we don't create a record yet - let the application handle it
    -- after organization creation
    IF user_role = 'business' THEN
        RETURN NEW;
    END IF;
    
    -- For other roles, create appropriate role-specific record
    -- Note: organization_id should be provided via metadata for non-business users
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    
    IF user_role = 'admin' THEN
        INSERT INTO public.admins (id, organization_id, is_owner)
        VALUES (NEW.id, org_id, false);
    ELSIF user_role = 'coach' THEN
        INSERT INTO public.coaches (id, organization_id)
        VALUES (NEW.id, org_id);
    ELSIF user_role = 'parent' THEN
        INSERT INTO public.parents (id, organization_id)
        VALUES (NEW.id, org_id);
    ELSIF user_role = 'partner' THEN
        INSERT INTO public.partners (id, organization_id)
        VALUES (NEW.id, org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_students_coach_id ON students(coach_id);
CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_videos_session_id ON videos(session_id);
CREATE INDEX idx_videos_coach_id ON videos(coach_id);
CREATE INDEX idx_videos_upload_status ON videos(upload_status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Database setup completed successfully!' AS message; 