<template>
  <div class="row">
    <div class="col-8 left">
      <!-- warehouse information -->
      <div class="information-card">
        <div class="info-group">
          <div class="info-label text-label-medium">Warehouse Name</div>
          <div class="info-value text-body-small">{{ warehouseInformation.name }}</div>
        </div>
        <div class="info-group">
          <div class="info-label text-label-medium">Type</div>
          <div class="info-value text-body-small">
            {{ warehouseInformation.warehouseType?.label || '-' }}
          </div>
        </div>
        <div class="info-group">
          <div class="info-label text-label-medium">Capacity</div>
          <div class="info-value text-body-small">{{ warehouseInformation.capacity }}</div>
        </div>
        <div class="info-group">
          <div class="info-label text-label-medium">Last Update</div>
          <div class="info-value text-body-small">
            {{ warehouseInformation.updatedAt.dateFull }} ({{
              warehouseInformation.updatedAt.timeAgo
            }})
          </div>
        </div>
        <div class="info-group">
          <div class="info-label text-label-medium">Creation Date</div>
          <div class="info-value text-body-small">
            {{ warehouseInformation.createdAt.dateFull }} ({{
              warehouseInformation.createdAt.timeAgo
            }})
          </div>
        </div>
        <!-- location information -->
        <template v-if="warehouseInformation.location">
          <div class="info-group">
            <div class="info-label text-label-medium">Region</div>
            <div class="info-value text-body-small">
              <template v-if="warehouseInformation.location.region">
                {{ warehouseInformation.location.region.name }}
                <span v-if="warehouseInformation.location.region.description">
                  ({{ warehouseInformation.location.region.description }})
                </span>
              </template>
              <template v-else>-</template>
            </div>
          </div>
          <div class="info-group">
            <div class="info-label text-label-medium">Province</div>
            <div class="info-value text-body-small">
              {{ warehouseInformation.location.province?.name || '-' }}
            </div>
          </div>
          <div class="info-group">
            <div class="info-label text-label-medium">Municipality</div>
            <div class="info-value text-body-small">
              {{ warehouseInformation.location.municipality?.name || '-' }}
            </div>
          </div>
          <div class="info-group">
            <div class="info-label text-label-medium">Barangay</div>
            <div class="info-value text-body-small">
              {{ warehouseInformation.location.barangay?.name || '-' }}
            </div>
          </div>
          <div class="info-group">
            <div class="info-label text-label-medium">Location Name</div>
            <div class="info-value text-body-small">{{ warehouseInformation.location.name || '-' }}</div>
          </div>
          <div class="info-group">
            <div class="info-label text-label-medium">Zip Code</div>
            <div class="info-value text-body-small">
              {{ warehouseInformation.location.zipCode || '-' }}
            </div>
          </div>
          <div class="info-group">
            <div class="info-label text-label-medium">Landmark</div>
            <div class="info-value text-body-small">
              {{ warehouseInformation.location.landmark || '-' }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="info-group">
            <div class="info-label text-label-medium">Location</div>
            <div class="info-value text-body-small">No location information available</div>
          </div>
        </template>
      </div>
    </div>

    <div class="col-4 right">
      <div class="text-title-medium text-center">QR Image</div>
      <div class="qr text-center q-mt-md">
        <q-img
          width="150px"
          height="150px"
          :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${warehouseInformation.id}`"
        >
        </q-img>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WarehouseInformationTab',
  props: {
    warehouseInformation: {
      type: Object,
      required: true,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {
    fetchData() {},
  },
};
</script>
