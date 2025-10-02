<template>
  <q-layout>
    <q-page-container>
      <div class="background-vector">
        <Suspense>
          <template #default>
            <router-view />
          </template>
          <template #fallback>
            <div class="flex flex-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </Suspense>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style src="./MainLayout.scss"></style>
<style src="./FrontLayout.scss"></style>

<script>
export default {
  name: 'BlankLayout',
  props: {},
  data: () => ({}),
  mounted() {
    // Theme is now set globally in boot file - no need to call here
  },
};
</script>
