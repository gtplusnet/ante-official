<template>
  <div>
    <div v-if="showTitle" class="label text-label-large  ">{{ customTitle }}</div>
    <q-select ref="tagInput" v-model="tags" use-input use-chips multiple input-debounce="0" hide-dropdown-icon
      map-options emit-value clearable outlined dense hide-bottom-space class="q-mb-md text-body-medium" input-value="inputText"
      @input-value="inputText = $event" @new-value="addTag" @keydown="checkKeyDown" @blur="addTagBlur"/>
  </div>
</template>

<style lang="scss" src="./TagsPartial.scss" />

<script>
export default {
  name: 'TagsPartial',
  components: {},
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    customTitle: {
      type: String,
      default: 'Tags',
    },
    initialValue: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    tags: [],
    tagInputText: '',
  }),
  watch: {
    tags(val) {
      if (val == null) {
        this.tags = [];
      }
      this.$emit('onTagUpdate', this.tags);
    },
  },
  mounted() {
    this.tags = this.initialValue;
  },
  computed: {},
  methods: {
    checkKeyDown(e) {
      if (e.key === ',') {
        e.preventDefault();
        this.addTag(e.target.value);
      }
    },
    addTagBlur(e) {
      const value = e.target.value.trim();
      if (value) {
        this.addTag(value);
      }
    },
    addTag(val) {
      val = val.toUpperCase();
      const foundTag = this.tags.filter((str) => str.includes(val));

      if (foundTag.length == 0) {
        this.tags.push(val);
      }

      this.$refs.tagInput.updateInputValue('');
      this.$emit('onTagUpdate', this.tags);
    },
  },
};
</script>
