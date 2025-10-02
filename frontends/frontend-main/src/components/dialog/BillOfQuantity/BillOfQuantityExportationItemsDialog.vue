<template v-if="items">
  <template v-for="item in items" :key="item.id">
    <tr class="exportation">
      <td class="particulars">
        <span v-for="count in item.generation - 1" :key="count" class="spacing">&nbsp;&nbsp;&nbsp;&nbsp;</span>
        {{ item.numerals }}. {{ item.description }}
      </td>
      <td class="text-center">{{ item.quantity }}</td>
      <td class="text-center">
        {{ item.quantity ? item.materialUnit : null }}
      </td>
      <td class="text-right">
        {{ numberFormat(item.materialUnitCostWithProfit, false) }}
      </td>
      <td class="text-right">{{ numberFormat(item.materialTotalCostWithProfit) }}</td>
      <td class="text-right">{{ numberFormat(item.laborUnitCostWithProfit, false) }}</td>
      <td class="text-right">{{ numberFormat(item.laborTotalCostWithProfit) }}</td>
      <td class="text-right">{{ numberFormat(item.totalWithProfit) }}</td>
    </tr>

    <BillOfQuantityExportationItems :boqInformation="boqInformation" :boqId="boqId" v-if="item.children"
      :items="item.children" />
    <!-- Bill of Quantity Bottom Part - Sub Heading -->
    <tr @click.stop="showBillOfQuantityEditDialog(item)" v-if="item.type == 'SUBHEADING' && item.subTotalWithProfit"
      :class="item.type">
      <td class="particulars subtotal" colspan="7"></td>
      <td class="text-right">{{ numberFormat(item.subTotalWithProfit) }}</td>
    </tr>

    <!-- Bill of Quantity Bottom Part - Heading -->
    <tr @click.stop="showBillOfQuantityEditDialog(item)" v-if="item.type == 'HEADING' && item.subTotalWithProfit"
      class="HEADING-BOTTOM" :class="item.type">
      <td class="particulars subtotal" colspan="7">Subtotal</td>
      <td class="text-right">{{ numberFormat(item.subTotalWithProfit) }}</td>
    </tr>

  </template>
</template>

<style scoped></style>
<script>
export default {
  name: 'TemplateComponent',
  props: {
    boqInformation: {
      type: Object,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
  },
  data: () => ({}),
  watch: {},
  methods: {},
};
</script>
