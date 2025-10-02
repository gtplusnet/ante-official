import { RouteRecordRaw } from 'vue-router';
import Settings from '../pages/Member/Settings/Settings.vue';
import SettingsCompany from '../pages/Member/Settings/SettingsCompany.vue';
import SettingsBranches from '../pages/Member/Settings/SettingsBranches.vue';
import SettingsUser from '../pages/Member/Settings/SettingsUser.vue';
import SettingsRoleGroup from '../pages/Member/Settings/SettingsRoleGroup.vue';
import SettingsSuperAdmin from '../pages/Member/Settings/SettingsSuperAdmin.vue';
import SettingsRoles from '../pages/Member/Settings/SettingsRoles.vue';
import SettingsScope from '../pages/Member/Settings/SettingsScope.vue';
import SettingsDeveloperScripts from '../pages/Member/Settings/SettingsDeveloperScripts.vue';
import SettingsQueueProcess from '../pages/Member/Settings/SettingsQueueProcess.vue';

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'member_settings',
    component: Settings,
    children: [
      {
        path: 'company',
        name: 'member_settings_company',
        component: SettingsCompany,
      },
      {
        path: 'branches',
        name: 'member_settings_branches',
        component: SettingsBranches,
      },
      {
        path: 'user',
        name: 'member_settings_user',
        component: SettingsUser,
      },
      {
        path: 'role-group',
        name: 'member_settings_role_group',
        component: SettingsRoleGroup,
      },
      {
        path: 'super-admin',
        name: 'member_settings_super_admin',
        component: SettingsSuperAdmin,
      },
      {
        path: 'roles',
        name: 'member_settings_roles',
        component: SettingsRoles,
      },
      {
        path: 'scope',
        name: 'member_settings_scope',
        component: SettingsScope,
      },
      {
        path: 'developer-scripts',
        name: 'member_settings_developer_scripts',
        component: SettingsDeveloperScripts,
      },
      {
        path: 'queue-process',
        name: 'member_settings_queue_process',
        component: SettingsQueueProcess,
      },
    ],
  },
];

export default settingsRoutes;
