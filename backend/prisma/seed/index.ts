import { createSuperAdmin } from './createSuperAdmin';
import { createDefaultBoardLanes } from './seedDefaultBoardLanes';
// import { createGeneralAndVariantInventory } from './createInventory";
import { setDefaultBoardLaneConfiguration } from './seedConfigurationOfDefaultBoardLanes';
import { seedWorkflowTemplates } from './workflow-templates.seed';
// import { seedSyncScope } from './syncScope';

const main = async () => {
  await createSuperAdmin();
  await createDefaultBoardLanes();
  await setDefaultBoardLaneConfiguration();
  await seedWorkflowTemplates();
  // await seedSyncScope();
};

main();
