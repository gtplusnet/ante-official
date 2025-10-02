<template>
  <q-dialog ref="drawer" position="right" maximized class="notification-dialog">
    <q-card class="notification-card">
      <div bordered class="rounded-borders">
        <q-item-label header>
          <span class="text-black text-title-small">Notifications</span>
          <div class="float-right mark-as-read">
            <a href="#" class="text-primary text-label-small" @click.prevent="handleMarkAllAsRead">Mark all as read</a>
          </div>
        </q-item-label>
        <q-separator />
        <template v-for="data in notifications" :key="data.id">
          <div class="notif-item" :class="data.hasRead ? 'read' : 'unread'" @click="notificationClickHandler(data)" clickable v-ripple>
            <div class="avatar-container">
              <div class="trick-circle" :class="data.hasRead ? 'read' : 'unread'"></div>
              <q-avatar>
                <img :src="data.notificationSender.image" />
              </q-avatar>
            </div>

            <div class="notification-content">
              <div>
                <span class="name text-label-medium">{{ formatWord(data.notificationSender.firstName) }} {{ formatWord(data.notificationSender.lastName) }}</span>
                {{ data.notificationData.code.message }}
              </div>
              <div class="text-grey-7 q-mt-sm text-body-small">{{ truncate(data.notificationData.content, 'DEFAULT') }}</div>
              <div class="text-grey-7 q-mt-sm text-label-small">
                {{ data.notificationData.createdAt.timeAgo }}
              </div>
            </div>
          </div>

          <q-separator />
        </template>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped src="./Notification.scss"></style>
<script lang="ts">
import { QDrawer } from 'quasar';
import { formatWord } from 'src/utility/formatter';
import { useNotifications } from '../../composables/useNotifications';
import { truncate } from 'src/utility/formatter';

export default {
  name: 'MemberNotification',
  components: {},
  emits: ['update-notification-count'],
  setup(props, { emit }) {
    const notificationsComposable = useNotifications(emit);
    return {
      ...notificationsComposable,
      formatWord,
      truncate,
    };
  },
  mounted() {
    this.getNotifications();
    this.watchSocketEvent();
  },
  methods: {
    async handleMarkAllAsRead() {
      await this.markAllAsRead();
      (this.$refs.drawer as QDrawer).hide();
    },
  },
};
</script>