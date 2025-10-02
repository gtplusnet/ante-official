-- Create RPC function for atomic phase activation
CREATE OR REPLACE FUNCTION activate_task_phase(phase_id INT)
RETURNS void AS $$
BEGIN
  -- Update phase status to ACTIVE
  UPDATE "TaskPhase"
  SET status = 'ACTIVE',
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = phase_id
  AND status = 'DRAFT';  -- Only activate if currently DRAFT

  -- Update all tasks in the phase to non-draft
  UPDATE "Task"
  SET "isDraft" = false,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "taskPhaseId" = phase_id
  AND "isDraft" = true;  -- Only update draft tasks
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION activate_task_phase TO authenticated;