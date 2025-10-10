import { ref, Ref, onMounted, defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';
import ExpandedNavPageContainer from "../../../components/shared/ExpandedNavPageContainer.vue";
import ItemCategoryNode from "../../../components/ItemCategoryNode.vue";
import GTable from "../../../components/shared/display/GTable.vue";
import { useQuasar } from 'quasar';
import { ItemCategoryDataResponse } from '@shared/response/item-category.response';
import { handleAxiosError } from "../../../utility/axios.error.handler";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditItemCategoryDialog = defineAsyncComponent(() =>
  import("./dialogs/AssetAddEditItemCategoryDialog.vue")
);
const ViewItemCategoryDialog = defineAsyncComponent(() =>
  import("./dialogs/AssetViewItemCategoryDialog.vue")
);

export default {
  name: 'AssetItemCategories',
  components: {
    ExpandedNavPageContainer,
    AddEditItemCategoryDialog,
    ViewItemCategoryDialog,
    ItemCategoryNode,
    GTable,
  },
  setup() {
    const $q = useQuasar();
    const categories: Ref<ItemCategoryDataResponse[]> = ref([]);
    const loading: Ref<boolean> = ref(false);
    const categoryData: Ref<ItemCategoryDataResponse | null> = ref(null);
    const openAddEditCategoryDialog: Ref<boolean> = ref(false);
    const openViewCategoryDialog: Ref<boolean> = ref(false);
    const activeTab: Ref<string> = ref('tree');
    const tableRef = ref<{ refetch: () => void } | null>(null);

    const fetchCategories = async () => {
      loading.value = true;
      try {
        const response = await api.get('item-category/tree');
        categories.value = response.data;
      } catch (error: any) {
        handleAxiosError($q, error);
      } finally {
        loading.value = false;
      }
    };

    const openDialog = () => {
      categoryData.value = null;
      openAddEditCategoryDialog.value = true;
    }

    const openEditCategory = (category: ItemCategoryDataResponse) => {
      categoryData.value = category;
      openViewCategoryDialog.value = false;
      openAddEditCategoryDialog.value = true;
    }

    const viewCategory = (category: ItemCategoryDataResponse) => {
      categoryData.value = category;
      openViewCategoryDialog.value = true;
    }

    const editCategory = (category: ItemCategoryDataResponse) => {
      categoryData.value = category;
      openAddEditCategoryDialog.value = true;
    }

    const deleteCategory = (data: ItemCategoryDataResponse) => {
      $q
        .dialog({
          title: 'Delete Category',
          message: `Are you sure you want to delete <b>${data.name}</b> category?`,
          ok: 'Yes',
          cancel: 'No',
          html: true,
        })
        .onOk(() => {
          deleteCategoryData(data.id);
        });
    }

    const deleteCategoryData = async (categoryId: number) => {
      api
        .delete('item-category/' + categoryId)
        .then(() => {
          fetchCategories();
          if (tableRef.value) {
            tableRef.value.refetch();
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        });
    }

    const handleSaveDone = () => {
      fetchCategories();
      if (tableRef.value) {
        tableRef.value.refetch();
      }
    };

    onMounted(() => {
      fetchCategories();
    });

    return {
      categories,
      loading,
      categoryData,
      openAddEditCategoryDialog,
      openViewCategoryDialog,
      openDialog,
      openEditCategory,
      viewCategory,
      editCategory,
      deleteCategory,
      fetchCategories,
      activeTab,
      tableRef,
      handleSaveDone,
    }
  }
};
