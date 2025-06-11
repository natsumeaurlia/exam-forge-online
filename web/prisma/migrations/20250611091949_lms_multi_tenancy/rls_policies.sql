-- Row Level Security (RLS) Policies for LMS Multi-Tenancy
-- This file contains RLS policies to ensure strict data isolation between tenants

-- Enable RLS on all LMS tables
ALTER TABLE "LmsTenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsCourse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsModule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsLessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsCourseCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsCoursePrerequisite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LmsCertificate" ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's team memberships
CREATE OR REPLACE FUNCTION get_user_team_ids(user_id UUID)
RETURNS TABLE(team_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT tm."teamId", tm.role::TEXT
  FROM "TeamMember" tm
  WHERE tm."userId" = user_id
  AND tm.role IN ('OWNER', 'ADMIN', 'MEMBER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's tenant access
CREATE OR REPLACE FUNCTION has_tenant_access(user_id UUID, tenant_id UUID, required_roles TEXT[] DEFAULT ARRAY['OWNER', 'ADMIN', 'MEMBER'])
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM "LmsTenant" t
    JOIN "TeamMember" tm ON t."teamId" = tm."teamId"
    WHERE t.id = tenant_id
    AND tm."userId" = user_id
    AND tm.role::TEXT = ANY(required_roles)
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- LmsTenant Policies
CREATE POLICY "lms_tenant_select_policy" ON "LmsTenant"
  FOR SELECT
  USING (
    "teamId" IN (
      SELECT team_id FROM get_user_team_ids(auth.uid())
    )
  );

CREATE POLICY "lms_tenant_insert_policy" ON "LmsTenant"
  FOR INSERT
  WITH CHECK (
    "teamId" IN (
      SELECT team_id FROM get_user_team_ids(auth.uid())
      WHERE role = 'OWNER'
    )
  );

CREATE POLICY "lms_tenant_update_policy" ON "LmsTenant"
  FOR UPDATE
  USING (
    "teamId" IN (
      SELECT team_id FROM get_user_team_ids(auth.uid())
      WHERE role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "lms_tenant_delete_policy" ON "LmsTenant"
  FOR DELETE
  USING (
    "teamId" IN (
      SELECT team_id FROM get_user_team_ids(auth.uid())
      WHERE role = 'OWNER'
    )
  );

-- LmsCourse Policies
CREATE POLICY "lms_course_select_policy" ON "LmsCourse"
  FOR SELECT
  USING (
    -- Public published courses
    ("isPublic" = true AND status = 'PUBLISHED')
    OR
    -- Courses in user's tenant
    has_tenant_access(auth.uid(), "tenantId")
    OR
    -- Enrolled courses
    EXISTS (
      SELECT 1 FROM "LmsEnrollment" e
      WHERE e."courseId" = "LmsCourse".id
      AND e."userId" = auth.uid()
      AND e.status = 'ACTIVE'
    )
  );

CREATE POLICY "lms_course_insert_policy" ON "LmsCourse"
  FOR INSERT
  WITH CHECK (
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

CREATE POLICY "lms_course_update_policy" ON "LmsCourse"
  FOR UPDATE
  USING (
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

CREATE POLICY "lms_course_delete_policy" ON "LmsCourse"
  FOR DELETE
  USING (
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

-- LmsEnrollment Policies
CREATE POLICY "lms_enrollment_select_policy" ON "LmsEnrollment"
  FOR SELECT
  USING (
    -- Own enrollments
    "userId" = auth.uid()
    OR
    -- Tenant admin access
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

CREATE POLICY "lms_enrollment_insert_policy" ON "LmsEnrollment"
  FOR INSERT
  WITH CHECK (
    -- Self enrollment for public courses with self-signup enabled
    (
      "userId" = auth.uid()
      AND EXISTS (
        SELECT 1 
        FROM "LmsCourse" c
        JOIN "LmsTenant" t ON c."tenantId" = t.id
        WHERE c.id = "LmsEnrollment"."courseId"
        AND t."enableSelfSignup" = true
        AND c."isPublic" = true
        AND c.status = 'PUBLISHED'
      )
    )
    OR
    -- Admin enrollment
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

CREATE POLICY "lms_enrollment_update_policy" ON "LmsEnrollment"
  FOR UPDATE
  USING (
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

CREATE POLICY "lms_enrollment_delete_policy" ON "LmsEnrollment"
  FOR DELETE
  USING (
    has_tenant_access(auth.uid(), "tenantId", ARRAY['OWNER', 'ADMIN'])
  );

-- LmsLessonProgress Policies (users can only access their own progress)
CREATE POLICY "lms_progress_policy" ON "LmsLessonProgress"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "LmsEnrollment" e
      WHERE e.id = "LmsLessonProgress"."enrollmentId"
      AND e."userId" = auth.uid()
    )
  );

-- LmsComment Policies
CREATE POLICY "lms_comment_select_policy" ON "LmsComment"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM "LmsLesson" l
      JOIN "LmsModule" m ON l."moduleId" = m.id
      JOIN "LmsCourse" c ON m."courseId" = c.id
      LEFT JOIN "LmsEnrollment" e ON e."courseId" = c.id AND e."userId" = auth.uid()
      WHERE l.id = "LmsComment"."lessonId"
      AND (
        -- Public course
        (c."isPublic" = true AND c.status = 'PUBLISHED')
        OR
        -- Enrolled in course
        (e.id IS NOT NULL AND e.status = 'ACTIVE')
        OR
        -- Tenant admin
        has_tenant_access(auth.uid(), c."tenantId")
      )
    )
  );

CREATE POLICY "lms_comment_insert_policy" ON "LmsComment"
  FOR INSERT
  WITH CHECK (
    "userId" = auth.uid()
    AND EXISTS (
      SELECT 1 
      FROM "LmsLesson" l
      JOIN "LmsModule" m ON l."moduleId" = m.id
      JOIN "LmsCourse" c ON m."courseId" = c.id
      JOIN "LmsEnrollment" e ON e."courseId" = c.id
      WHERE l.id = "LmsComment"."lessonId"
      AND e."userId" = auth.uid()
      AND e.status = 'ACTIVE'
      AND l."allowComments" = true
    )
  );

CREATE POLICY "lms_comment_update_policy" ON "LmsComment"
  FOR UPDATE
  USING (
    "userId" = auth.uid()
  );

CREATE POLICY "lms_comment_delete_policy" ON "LmsComment"
  FOR DELETE
  USING (
    "userId" = auth.uid()
    OR
    EXISTS (
      SELECT 1 
      FROM "LmsLesson" l
      JOIN "LmsModule" m ON l."moduleId" = m.id
      JOIN "LmsCourse" c ON m."courseId" = c.id
      WHERE l.id = "LmsComment"."lessonId"
      AND has_tenant_access(auth.uid(), c."tenantId", ARRAY['OWNER', 'ADMIN'])
    )
  );

-- Additional security indexes for performance
CREATE INDEX IF NOT EXISTS idx_lms_tenant_team_id ON "LmsTenant"("teamId");
CREATE INDEX IF NOT EXISTS idx_lms_course_tenant_public ON "LmsCourse"("tenantId", "isPublic", status);
CREATE INDEX IF NOT EXISTS idx_lms_enrollment_user_status ON "LmsEnrollment"("userId", status);
CREATE INDEX IF NOT EXISTS idx_lms_enrollment_course_user ON "LmsEnrollment"("courseId", "userId");

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_user_team_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_tenant_access(UUID, UUID, TEXT[]) TO authenticated;