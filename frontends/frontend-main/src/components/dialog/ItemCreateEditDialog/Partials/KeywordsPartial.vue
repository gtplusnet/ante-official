<template>
  <div>
    <div v-if="showTitle" class="label text-label-large">{{ customTitle }}</div>
    <q-select ref="keywordInput" v-model="keywords" use-input use-chips multiple input-debounce="0" hide-dropdown-icon
      map-options emit-value clearable outlined dense hide-bottom-space class="q-mb-md text-body-medium" input-value="inputText"
      @input-value="inputText = $event" @new-value="addKeyword" @keydown="checkKeyDown" @blur="addKeywordBlur"/>
  </div>
</template>

<style lang="scss" src="./TagsPartial.scss" />

<script>
export default {
  name: 'KeywordsPartial',
  components: {},
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    customTitle: {
      type: String,
      default: 'Keywords',
    },
    initialValue: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    keywords: [],
    keywordInputText: '',
  }),
  watch: {
    keywords(val) {
      if (val == null) {
        this.keywords = [];
      }
      this.$emit('onKeywordUpdate', this.keywords);
    },
  },
  mounted() {
    this.keywords = this.initialValue;
  },
  computed: {},
  methods: {
    checkKeyDown(e) {
      if (e.key === ',') {
        e.preventDefault();
        this.addKeyword(e.target.value);
      }
    },
    addKeywordBlur(e) {
      const value = e.target.value.trim();
      if (value) {
        this.addKeyword(value);
      }
    },
    addKeyword(val) {
      val = val.toUpperCase();
      const foundKeyword = this.keywords.filter((str) => str.includes(val));

      if (foundKeyword.length == 0) {
        this.keywords.push(val);
      }

      this.$refs.keywordInput.updateInputValue('');
      this.$emit('onKeywordUpdate', this.keywords);
    },
  },
};
</script>
