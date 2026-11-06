ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own reports"
ON "Report"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own profile"
ON "User"
FOR ALL
USING (auth.uid()::text = "id")
WITH CHECK (auth.uid()::text = "id");
