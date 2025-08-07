-- Student & Parent Portal Database Extensions
-- Run this after the main supabase-setup.sql script

-- Create additional enums for student/parent features
CREATE TYPE badge_type AS ENUM ('trick_mastery', 'consistency', 'progression', 'creativity', 'participation', 'milestone');
CREATE TYPE notification_type AS ENUM ('new_video', 'session_summary', 'badge_earned', 'milestone_reached', 'progress_update');
CREATE TYPE achievement_category AS ENUM ('tricks', 'sessions', 'consistency', 'creativity', 'progression');

-- Extend students table to link to user accounts (for student portal access)
ALTER TABLE students ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN xp_points INTEGER DEFAULT 0 CHECK (xp_points >= 0);
ALTER TABLE students ADD COLUMN total_videos INTEGER DEFAULT 0 CHECK (total_videos >= 0);
ALTER TABLE students ADD COLUMN landed_tricks INTEGER DEFAULT 0 CHECK (landed_tricks >= 0);
ALTER TABLE students ADD COLUMN session_count INTEGER DEFAULT 0 CHECK (session_count >= 0);

-- Create parent_children table (many-to-many relationship)
CREATE TABLE parent_children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Create badges table
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type badge_type NOT NULL,
    icon TEXT NOT NULL, -- Icon name for UI
    requirements JSONB NOT NULL, -- Requirements to earn this badge
    xp_reward INTEGER DEFAULT 0 CHECK (xp_reward >= 0),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_badges table (earned badges)
CREATE TABLE student_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- Create achievements table (different from badges - specific accomplishments)
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category achievement_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trick_progress table (track individual trick progression)
CREATE TABLE trick_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    trick_name TEXT NOT NULL,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    landings INTEGER DEFAULT 0 CHECK (landings >= 0),
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    first_attempt_date TIMESTAMP WITH TIME ZONE,
    first_landing_date TIMESTAMP WITH TIME ZONE,
    last_attempt_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, trick_name)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for the notification
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personal_videos table (student-uploaded videos)
CREATE TABLE personal_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Either student or parent
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    trick_name TEXT,
    description TEXT,
    landed BOOLEAN DEFAULT FALSE,
    duration INTEGER, -- in seconds
    upload_status upload_status DEFAULT 'pending',
    upload_progress INTEGER DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE trick_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables

-- Parent_children policies
CREATE POLICY "Parents can view their children" ON parent_children
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can manage their children relationships" ON parent_children
    FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Organization members can view parent-child relationships" ON parent_children
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = parent_children.student_id 
            AND students.organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Badges policies
CREATE POLICY "Organization members can view badges" ON badges
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage badges" ON badges
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('business', 'admin')
        )
    );

-- Student_badges policies
CREATE POLICY "Students can view their own badges" ON student_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_badges.student_id 
            AND students.user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view their children's badges" ON student_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_children 
            WHERE parent_children.student_id = student_badges.student_id 
            AND parent_children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can view student badges" ON student_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_badges.student_id 
            AND students.organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Achievements policies (similar to student_badges)
CREATE POLICY "Students can view their own achievements" ON achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = achievements.student_id 
            AND students.user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view their children's achievements" ON achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_children 
            WHERE parent_children.student_id = achievements.student_id 
            AND parent_children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can view achievements" ON achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = achievements.student_id 
            AND students.organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Trick_progress policies (similar pattern)
CREATE POLICY "Students can view their own trick progress" ON trick_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = trick_progress.student_id 
            AND students.user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view their children's trick progress" ON trick_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_children 
            WHERE parent_children.student_id = trick_progress.student_id 
            AND parent_children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can view trick progress" ON trick_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = trick_progress.student_id 
            AND students.organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- Personal_videos policies
CREATE POLICY "Students can view their own personal videos" ON personal_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = personal_videos.student_id 
            AND students.user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view their children's personal videos" ON personal_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_children 
            WHERE parent_children.student_id = personal_videos.student_id 
            AND parent_children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Students and parents can upload personal videos" ON personal_videos
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND (
            -- Student uploading their own video
            EXISTS (
                SELECT 1 FROM students 
                WHERE students.id = personal_videos.student_id 
                AND students.user_id = auth.uid()
            ) OR
            -- Parent uploading for their child
            EXISTS (
                SELECT 1 FROM parent_children 
                WHERE parent_children.student_id = personal_videos.student_id 
                AND parent_children.parent_id = auth.uid()
            )
        )
    );

-- Create the handle_updated_at function if it does not exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON badges FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON trick_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON personal_videos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_parent_children_parent_id ON parent_children(parent_id);
CREATE INDEX idx_parent_children_student_id ON parent_children(student_id);
CREATE INDEX idx_badges_organization_id ON badges(organization_id);
CREATE INDEX idx_student_badges_student_id ON student_badges(student_id);
CREATE INDEX idx_achievements_student_id ON achievements(student_id);
CREATE INDEX idx_trick_progress_student_id ON trick_progress(student_id);
CREATE INDEX idx_trick_progress_trick_name ON trick_progress(trick_name);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_personal_videos_student_id ON personal_videos(student_id);

-- Create default badges for organizations
INSERT INTO badges (name, description, type, icon, requirements, xp_reward) VALUES
('First Landing', 'Land your first trick!', 'milestone', 'trophy', '{"landed_tricks": 1}', 50),
('Consistent Performer', 'Attend 5 sessions in a month', 'participation', 'calendar', '{"sessions_per_month": 5}', 100),
('Trick Master', 'Master 3 different tricks', 'trick_mastery', 'star', '{"mastered_tricks": 3}', 200),
('Dedicated Student', 'Attend 20 total sessions', 'participation', 'medal', '{"total_sessions": 20}', 300),
('Progress Pioneer', 'Improve success rate by 25%', 'progression', 'trending-up', '{"improvement_percentage": 25}', 150);

-- Function to update student statistics when videos are added
CREATE OR REPLACE FUNCTION update_student_stats()
RETURNS trigger AS $$
BEGIN
    -- Update total videos and landed tricks count
    UPDATE students SET
        total_videos = (
            SELECT COUNT(*) FROM video_students vs 
            JOIN videos v ON vs.video_id = v.id 
            WHERE vs.student_id = NEW.student_id
        ),
        landed_tricks = (
            SELECT COUNT(*) FROM video_students vs 
            JOIN videos v ON vs.video_id = v.id 
            WHERE vs.student_id = NEW.student_id AND v.landed = true
        )
    WHERE id = NEW.student_id;
    
    -- Update session count
    UPDATE students SET
        session_count = (
            SELECT COUNT(DISTINCT ss.session_id) FROM session_students ss
            WHERE ss.student_id = NEW.student_id
        )
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update student stats
CREATE TRIGGER update_student_stats_on_video 
    AFTER INSERT ON video_students 
    FOR EACH ROW EXECUTE FUNCTION update_student_stats();

CREATE TRIGGER update_student_stats_on_session 
    AFTER INSERT ON session_students 
    FOR EACH ROW EXECUTE FUNCTION update_student_stats();

-- Function to update trick progress
CREATE OR REPLACE FUNCTION update_trick_progress()
RETURNS trigger AS $$
DECLARE
    student_rec RECORD;
BEGIN
    -- Get all students in this video
    FOR student_rec IN 
        SELECT vs.student_id FROM video_students vs WHERE vs.video_id = NEW.id
    LOOP
        -- Update trick progress if trick_name is provided
        IF NEW.trick_name IS NOT NULL THEN
            INSERT INTO trick_progress (student_id, trick_name, attempts, landings, first_attempt_date, last_attempt_date)
            VALUES (
                student_rec.student_id, 
                NEW.trick_name, 
                1, 
                CASE WHEN NEW.landed THEN 1 ELSE 0 END,
                NEW.created_at,
                NEW.created_at
            )
            ON CONFLICT (student_id, trick_name) DO UPDATE SET
                attempts = trick_progress.attempts + 1,
                landings = trick_progress.landings + CASE WHEN NEW.landed THEN 1 ELSE 0 END,
                last_attempt_date = NEW.created_at,
                first_landing_date = CASE 
                    WHEN NEW.landed AND trick_progress.first_landing_date IS NULL 
                    THEN NEW.created_at 
                    ELSE trick_progress.first_landing_date 
                END,
                success_rate = ROUND(
                    (trick_progress.landings + CASE WHEN NEW.landed THEN 1 ELSE 0 END) * 100.0 / 
                    (trick_progress.attempts + 1), 2
                ),
                updated_at = NOW();
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update trick progress
CREATE TRIGGER update_trick_progress_on_video 
    AFTER INSERT ON videos 
    FOR EACH ROW EXECUTE FUNCTION update_trick_progress();

-- Success message
SELECT 'Student & Parent Portal extensions created successfully!' AS message; 