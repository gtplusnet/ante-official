<template>
  <div class="q-pt-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-title-small text-primary">Tiers</div>
      <div>
        <q-btn dense flat round :ripple="false" color="primary" icon="control_point" @click="addTier">
          <q-tooltip class="text-label-small"> Add new tier </q-tooltip>
        </q-btn>
      </div>
    </div>

    <div v-for="(tier, index) in data" :key="index">
      <!-- Tier Key -->
      <div class="row q-gutter-sm q-mb-sm">
        <div class="col">
          <GInput required type="text_with_delete" class="text-body-medium" label="Tier Key" v-model="tier.key"
            @onDelete="onDeleteClicked(index)" @input="onTierKeyUpdated(index, tier.key)">
            <template v-slot:after> test </template>
          </GInput>
        </div>
      </div>

      <!-- Tier Attributes -->
      <div class="row q-gutter-sm">
        <div class="col">
          <tags-partial class="text-body-medium" customTitle="Attributes" :itemInformation="itemInformation"
            :initialValue="tier.attributes" @onTagUpdate="onTagUpdated(index, $event)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GInput from "../../../../../components/shared/form/GInput.vue";
import TagsPartial from '../../Partials/TagsPartial.vue';

const defaultTierObject = {
  key: '',
  attributes: [],
};

export default {
  name: 'TiersPartial',
  components: { GInput, TagsPartial },
  props: {
    itemInformation: {
      type: Object || null,
      default: null,
    },
  },
  data() {
    return {
      data: [{ ...defaultTierObject }],
    };
  },
  async mounted() {
    if (this.itemInformation) {
      this.variations = this.itemInformation.variations;

      this.data = [];

      for (let variation of this.variations) {
        const attributes = await variation.itemTierAttribute.map(
          (tag) => tag.attributeKey
        );

        let tempTierObject = {};
        tempTierObject.key = variation.name;

        tempTierObject.attributes = attributes;

        this.data.push(tempTierObject);
      }

      this.emitDataUpdate();
    }
  },
  methods: {
    addTier() {
      this.data.push({ ...defaultTierObject });
      this.emitDataUpdate();
    },
    onDeleteClicked(index) {
      this.data.splice(index, 1);
      this.emitDataUpdate();
    },
    onTierKeyUpdated(index, newKey) {
      this.data[index].key = newKey;
      this.emitDataUpdate();
    },
    onTagUpdated(index, updatedTags) {
      this.data[index].attributes = updatedTags;
      this.emitDataUpdate();
    },
    emitDataUpdate() {
      this.$emit('onTierUpdate', this.data);
    },
  },
};
</script>
