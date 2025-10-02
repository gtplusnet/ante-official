-- Fix college grade levels that were incorrectly set to ELEMENTARY
UPDATE "GradeLevel"
SET "educationLevel" = 'COLLEGE',
    "sequence" = CASE
        WHEN UPPER("name") LIKE '%FIRST YEAR%' OR UPPER("name") LIKE '%1ST YEAR%' THEN 16
        WHEN UPPER("name") LIKE '%SECOND YEAR%' OR UPPER("name") LIKE '%2ND YEAR%' THEN 17
        WHEN UPPER("name") LIKE '%THIRD YEAR%' OR UPPER("name") LIKE '%3RD YEAR%' THEN 18
        WHEN UPPER("name") LIKE '%FOURTH YEAR%' OR UPPER("name") LIKE '%4TH YEAR%' THEN 19
        WHEN UPPER("name") LIKE '%FIFTH YEAR%' OR UPPER("name") LIKE '%5TH YEAR%' THEN 20
        ELSE "sequence"
    END
WHERE "isDeleted" = false
  AND (
    -- College year patterns
    UPPER("name") LIKE '%FIRST YEAR%'
    OR UPPER("name") LIKE '%SECOND YEAR%'
    OR UPPER("name") LIKE '%THIRD YEAR%'
    OR UPPER("name") LIKE '%FOURTH YEAR%'
    OR UPPER("name") LIKE '%FIFTH YEAR%'
    OR UPPER("name") LIKE '%1ST YEAR%'
    OR UPPER("name") LIKE '%2ND YEAR%'
    OR UPPER("name") LIKE '%3RD YEAR%'
    OR UPPER("name") LIKE '%4TH YEAR%'
    OR UPPER("name") LIKE '%5TH YEAR%'
    -- College keywords
    OR UPPER("name") LIKE '%COLLEGE%'
    OR UPPER("name") LIKE '%UNIVERSITY%'
    OR UPPER("name") LIKE '%BACHELOR%'
    OR UPPER("name") LIKE '%BS %'
    OR UPPER("name") LIKE '%BA %'
    OR UPPER("name") LIKE '%BSBA%'
    -- Generic year pattern (but not grade year)
    OR (UPPER("name") LIKE '%YEAR%' AND UPPER("name") NOT LIKE '%GRADE%')
  );