-- ============================================================================
-- BoardLane Table Security Rules
-- ============================================================================
-- Row Level Security policies for the BoardLane table
-- TEMPORARY: Permissive policy for frontend access with custom JWT
-- File: /src/security/rules/tables/board-lane.sql
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "authenticated_board_lanes_select" ON public."BoardLane";
DROP POLICY IF EXISTS "frontend_board_lanes_select" ON public."BoardLane";

-- TEMPORARY: Permissive policy for all SELECT operations
-- BoardLanes are global across the system (BACKLOG, IN_PROGRESS, DONE, etc.)
CREATE POLICY "board_lane_select_permissive" ON public."BoardLane"
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Note: BoardLanes are global configuration data, safe to expose