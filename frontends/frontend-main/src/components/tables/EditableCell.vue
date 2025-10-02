<template>
  <div
    class="editable-cell"
    :class="[align, { 'text-blue': isHighlighted }]"
    @click.stop="startEditing"
  >
    <div v-if="isEditing" class="inline-edit">
      <input
        type="number"
        v-model.number="inputValue"
        @keyup.enter="navigateOnEnter"
        @keydown.tab="navigateOnTab"
        @keydown.up="(e) => navigateCell(e, 'up')"
        @keydown.down="(e) => navigateCell(e, 'down')"
        @keydown.left="(e) => navigateCell(e, 'left')"
        @keydown.right="(e) => navigateCell(e, 'right')"
        @blur="saveValue"
        @keyup.esc="cancelEdit"
        ref="editInput"
        class="excel-like-input"
        step="any"
      />
    </div>
    <div v-else class="cell-content">
      <slot>{{ formatValue }}</slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditableCell',
  props: {
    value: { type: [Number, String], required: true },
    item: { type: Object, required: true },
    field: { type: String, required: true },
    align: { type: String, default: 'text-right' },
    isHighlighted: { type: Boolean, default: false },
    formatFn: { type: Function, default: null },
    isEditable: { type: Boolean, default: true }
  },
  data() {
    return {
      isEditing: false,
      inputValue: null
    };
  },
  computed: {
    formatValue() {
      return this.formatFn ? this.formatFn(this.value) : this.value;
    }
  },
  methods: {
    startEditing() {
      if (!this.isEditable) return;
      
      this.isEditing = true;
      this.inputValue = this.value;
      this.$emit('edit-start', { item: this.item, field: this.field });
      
      this.$nextTick(() => {
        if (this.$refs.editInput) {
          this.$refs.editInput.focus();
          this.$refs.editInput.select();
        }
      });
    },
    
    saveValue() {
      if (this.inputValue !== this.value) {
        this.$emit('update:value', this.inputValue);
        this.$emit('save', {
          item: this.item,
          field: this.field,
          value: this.inputValue
        });
      }
      this.isEditing = false;
    },
    
    cancelEdit() {
      this.isEditing = false;
      this.$emit('cancel');
    },
    
    navigateOnEnter() {
      this.saveValue();
      this.$emit('navigate', { direction: 'down', item: this.item, field: this.field });
    },
    
    navigateOnTab(event) {
      event.preventDefault();
      this.saveValue();
      const direction = event.shiftKey ? 'left' : 'right';
      this.$emit('navigate', { direction, item: this.item, field: this.field });
    },
    
    navigateCell(event, direction) {
      // Don't navigate if user is editing a number and pressing left/right to position cursor
      if ((direction === 'left' || direction === 'right') && 
          event.target.selectionStart !== event.target.selectionEnd) {
        return;
      }
      
      // Only navigate left/right if at the beginning/end of the input
      if (direction === 'left' && event.target.selectionStart !== 0) {
        return;
      }
      if (direction === 'right' && event.target.selectionStart !== event.target.value.length) {
        return;
      }
      
      event.preventDefault();
      this.saveValue();
      this.$emit('navigate', { direction, item: this.item, field: this.field });
    }
  }
};
</script>

<style scoped>
.editable-cell {
  position: relative;
  cursor: cell;
  transition: background-color 0.2s;
  min-height: 24px; /* Smaller minimum height */
  display: block;
  width: 100%;
  height: 100%;
  padding: 2px 4px;
}

.editable-cell:hover {
  background-color: #f0f8ff;
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-right .cell-content {
  justify-content: flex-end;
}

.text-left .cell-content {
  justify-content: flex-start;
}

.inline-edit {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.excel-like-input {
  width: 100%;
  height: 100%;
  min-height: 24px;
  padding: 2px 4px;
  border: 2px solid #1a73e8;
  outline: none;
  background-color: #fff;
  font-size: 13px;
  box-sizing: border-box;
}
</style>
