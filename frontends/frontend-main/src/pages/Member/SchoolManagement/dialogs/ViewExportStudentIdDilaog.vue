<template>
  <q-dialog
    v-model="model"
    @before-show="fetchStudentData"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-title-medium text-dark">
          <q-icon name="o_picture_as_pdf" size="sm" />
          Export Student IDs
        </div>
        <q-space />
        <div class="text-body-medium text-dark q-mr-md">
          {{ selectedStudents.length }} of {{ totalStudents }} selected
        </div>
        <g-button flat round dense icon-size="md" icon="close" v-close-popup />
      </q-card-section>

      <!-- Selection Controls -->
      <div class="selection-controls">
        <q-checkbox
          v-model="selectAll"
          label="Select All (on this page)"
          @update:model-value="toggleSelectAll"
        />
        <q-space />
        <div class="row items-center">
          <q-select
            v-model="selectedSectionFilter"
            :options="sectionOptions"
            label="Filter by Section"
            dense
            outlined
            emit-value
            map-options
            clearable
            :loading="loadingSections"
            style="min-width: 220px"
            class="q-mr-sm"
          />
          <q-select
            v-model="selectedSection"
            :options="options"
            label="Search By"
            dense
            outlined
            emit-value
            map-options
            style="width: 150px"
            class="q-mr-sm"
          />
          <q-input
            style="width: 250px"
            v-model="search"
            label="Search"
            placeholder="Search students..."
            dense
            outlined
          />
        </div>
      </div>

      <div class="content q-px-md q-pb-md">
        <div>
          <!-- Student Grid -->
          <div class="student-grid">
            <div
              v-if="loading"
              class="absolute-center row items-center justify-center q-pa-xl"
            >
              <q-spinner-dots size="50px" color="primary" />
              <div class="q-ml-md text-h6">Loading students...</div>
            </div>

            <div
              v-else-if="studentData?.list?.length"
              v-for="student in studentData.list"
              :key="student.id"
              class="student-card"
              :class="{ selected: selectedStudents.includes(student.id) }"
            >
              <q-checkbox
                v-model="selectedStudents"
                :val="student.id"
                class="student-checkbox"
              />
              <div class="student-preview">
                <div class="student-info">
                  <div class="student-name">
                    {{ student.firstName }} {{ student.lastName }}
                  </div>
                  <div class="student-details">
                    {{ student.lrn }} | {{ student.section?.name }}
                  </div>
                </div>
                <student-id-card
                  :student-data="student"
                  :preview="true"
                  class="id-preview"
                />
              </div>
            </div>

            <div
              v-else
              class="absolute-center row items-center justify-center q-pa-xl"
            >
              <q-icon name="school" size="50px" color="grey" />
              <div class="q-ml-md text-h6 text-grey">No students found</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hidden rendering area for PDF generation -->
      <div ref="renderArea" class="pdf-render-area">
        <student-id-card
          v-for="student in selectedStudentsData"
          :key="`render-${student.id}`"
          :student-data="student"
          :ref="setCardRef"
        />
      </div>

      <div class="btn-actions q-pa-md">
        <!-- Pagination Controls -->
        <div class="pagination-controls rounded-borders">
          <div class="row items-center">
            <div class="text-body-medium q-mr-md">
              Page {{ currentPage }} of {{ totalPages }} ({{
                studentData?.list?.length || 0
              }}
              students on this page)
            </div>
            <g-button
              :disabled="currentPage <= 1 || isLoadingAll || hasLoadedAll"
              @click="fetchStudentData(currentPage - 1)"
              icon="chevron_left"
              flat
              round
              dense
              color="primary"
            />
            <span class="q-mx-sm">{{ currentPage }} / {{ totalPages }}</span>
            <g-button
              :disabled="
                currentPage >= totalPages || isLoadingAll || hasLoadedAll
              "
              @click="fetchStudentData(currentPage + 1)"
              icon="chevron_right"
              flat
              round
              dense
              color="primary"
            />
          </div>
        </div>

        <div>
          <g-button
            @click="loadAllStudents"
            :loading="isLoadingAll"
            :disabled="isLoadingAll"
            label="Load All Students"
            color="secondary"
            variant="outline"
            class="q-mr-sm"
          />

          <!-- This is My last Changes Here: Export button with loading percentage display -->
          <g-button
            :disabled="selectedStudents.length === 0 || isGeneratingPdf"
            :loading="isGeneratingPdf"
            @click="exportSelectedStudents"
            :label="isGeneratingPdf ? '' : 'Export Selected'"
            icon="o_download"
            icon-size="md"
            color="primary"
            :style="isGeneratingPdf ? 'min-width: 180px' : ''"
          >
            <template #loading>
              <div class="row items-center no-wrap" style="gap: 8px">
                <q-spinner-dots color="white" size="18px" />
                <span style="font-size: 14px; white-space: nowrap"
                  >{{ exportProgress }}% {{ exportStage }}</span
                >
              </div>
            </template>
          </g-button>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import GButton from "src/components/shared/buttons/GButton.vue";
import StudentIdCard from "./StudentIdCard.vue";
import { defineComponent, computed, ref, getCurrentInstance, watch, onMounted } from "vue";
import type { StudentResponse } from "@shared/response";
import { useStudentIdPdf } from "src/composables/useStudentIdPdf";
import { debounce } from "quasar";

export default defineComponent({
  name: "ViewExportStudentIdDilaog",
  components: {
    GButton,
    StudentIdCard,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const studentData = ref<{ list: StudentResponse[] } | null>(null);
    const selectedStudents = ref<string[]>([]);
    const loading = ref(false);
    const cardRefs = ref<any[]>([]);
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const selectedSection = ref("firstName");
    const search = ref("");
    const options = ref([
      { label: "First Name", value: "firstName" },
      { label: "Last Name", value: "lastName" },
      { label: "Student ID", value: "studentId" },
      { label: "LRN", value: "lrn" },
    ]);

    // Section filter state
    const sectionOptions = ref<Array<{ label: string; value: string }>>([]);
    const sections = ref<any[]>([]);
    const selectedSectionFilter = ref<string | null>(null);
    const loadingSections = ref(false);

    // Pagination state
    const currentPage = ref(1);
    const totalPages = ref(0);
    const perPage = ref(100);
    const allStudents = ref<StudentResponse[]>([]);
    const isLoadingAll = ref(false);
    const hasLoadedAll = ref(false);

    // PDF generation
    const { isGenerating: isGeneratingPdf, generateBatchStudentIdPdf } =
      useStudentIdPdf();

    // Cache for preloaded static images
    const staticImagesPreloaded = ref(false);

    // This is My last Changes Here: Export progress tracking with percentage display
    const exportProgress = ref(0);
    const exportStage = ref("");

    const model = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit("update:modelValue", value),
    });

    const totalStudents = computed(() => {
      return studentData.value?.list?.length || 0;
    });

    const selectAll = computed({
      get: () => {
        const currentList = studentData.value?.list || [];
        return (
          currentList.length > 0 &&
          currentList.every((student) =>
            selectedStudents.value.includes(student.id)
          )
        );
      },
      set: (value: boolean) => {
        if (value) {
          // Only select students on current page/view
          const currentIds = (studentData.value?.list || []).map((s) => s.id);
          selectedStudents.value = [
            ...new Set([...selectedStudents.value, ...currentIds]),
          ];
        } else {
          // Deselect students on current page/view
          const currentIds = (studentData.value?.list || []).map((s) => s.id);
          selectedStudents.value = selectedStudents.value.filter(
            (id) => !currentIds.includes(id)
          );
        }
      },
    });

    const selectedStudentsData = computed(() => {
      return (
        studentData.value?.list?.filter((student) =>
          selectedStudents.value.includes(student.id)
        ) || []
      );
    });

    const fetchStudentData = async (page = 1, append = false) => {
      loading.value = true;

      // Preload images on first load
      if (page === 1 && !append) {
        await preloadImages();
      }

      try {
        // Build request body with search parameters
        const requestBody: any = {
          filters: [],  // Changed from filter: {} to filters: []
          sort: { createdAt: "desc" },
          include: ["workflowInstance.currentStage"],
        };

        // Add section filter if selected
        if (selectedSectionFilter.value) {
          requestBody.filters.push({
            sectionId: selectedSectionFilter.value,
          });
          console.log('[Section Filter] Applied:', {
            sectionId: selectedSectionFilter.value,
            sectionName: sectionOptions.value.find(s => s.value === selectedSectionFilter.value)?.label || 'Unknown'
          });
        }

        // Add search parameters if search is active
        if (search.value && selectedSection.value) {
          requestBody.searchKeyword = search.value;
          requestBody.searchBy = selectedSection.value;
        }

        // If searching or filtering by section, load all students at once
        const searchPerPage = (search.value || selectedSectionFilter.value) ? 99999 : perPage.value;

        const response = await $api.put(
          `school/student/table?page=${page}&perPage=${searchPerPage}`,
          requestBody
        );

        // For Debugging
        if (selectedSectionFilter.value) {
          console.log('[Section Filter] Results:', {
            studentsLoaded: response.data.list?.length || 0,
            firstStudent: response.data.list?.[0] ? {
              name: `${response.data.list[0].firstName} ${response.data.list[0].lastName}`,
              section: response.data.list[0].section?.name || 'No section'
            } : 'No students'
          });
        }

        if (append) {
          // Appending for "Load All"
          allStudents.value = [...allStudents.value, ...response.data.list];
        } else {
          // Regular page load
          studentData.value = response.data;
          currentPage.value = response.data.currentPage || page;
          // Clear selections when changing pages
          selectedStudents.value = [];
          // Reset hasLoadedAll flag when fetching regular pages
          hasLoadedAll.value = false;
        }

        // Extract total pages from pagination array
        if (
          response.data.pagination &&
          Array.isArray(response.data.pagination)
        ) {
          const lastPage = response.data.pagination
            .filter((p) => typeof p === "number")
            .pop();
          totalPages.value = lastPage || 1;
        }

        return response.data;
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        loading.value = false;
      }
    };

    const loadAllStudents = async () => {
      isLoadingAll.value = true;
      allStudents.value = [];

      try {
        // First get page 1 to know total pages
        const firstPage = await fetchStudentData(1, false);
        allStudents.value = [...firstPage.list];

        // Load remaining pages
        for (let page = 2; page <= totalPages.value; page++) {
          await fetchStudentData(page, true);
        }

        // Set all students as the current view
        studentData.value = { list: allStudents.value };
        hasLoadedAll.value = true;
      } catch (error) {
        console.error("Error loading all students:", error);
      } finally {
        isLoadingAll.value = false;
      }
    };

    // Load sections from API
    const loadSections = async () => {
      try {
        loadingSections.value = true;
        const response = await $api.get("school/section/list");
        sections.value = response.data || [];

        // Format sections for the dropdown (clearable handles "All Sections")
        sectionOptions.value = sections.value.map((section: any) => ({
          label: `${section.gradeLevel?.name || "No Grade"} - ${section.name}`,
          value: section.id,
        }));
      } catch (error) {
        console.error("Failed to load sections:", error);
      } finally {
        loadingSections.value = false;
      }
    };

    const toggleSelectAll = (value: boolean) => {
      selectAll.value = value;
    };

    const setCardRef = (el: any) => {
      if (el) {
        cardRefs.value.push(el);
      }
    };

    // This is My last Changes Here: Smart image preloading - only once per session
    const preloadImages = async () => {
      // This is My last Changes Here: Only preload static images once per session for better performance
      if (!staticImagesPreloaded.value) {
        const imagesToPreload = [
          "/FRONT_BG with BLEED.png",
          "/BACK_BG with BLEED.png",
          "/sample-picture.png",
          "/elem-signatorist.png",
          "/hs-signatorist.png",
          "/college-employee-signatorist.png",
        ];

        // Preload static images
        const staticImagePromises = imagesToPreload.map((src) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
              resolve();
            };

            img.onerror = () => {
              console.error("Failed to preload static image:", src);
              resolve(); // Continue even if one fails
            };

            img.src = src;
          });
        });

        await Promise.all(staticImagePromises);
        staticImagesPreloaded.value = true;
      }

      // This is My last Changes Here: Profile photos loaded on-demand during PDF generation (removed redundant preload)
    };

    // Watch for search changes with debounce
    const debouncedFetch = debounce(() => {
      hasLoadedAll.value = false; // Reset when searching
      fetchStudentData(1);
    }, 500);

    watch([search, selectedSection, selectedSectionFilter], () => {
      // Trigger search even if search is empty (to reset)
      debouncedFetch();
    });

    // Load sections on component mount
    onMounted(() => {
      loadSections();
    });

    // This is My last Changes Here: Export function with progress tracking from 1% to 100%
    const exportSelectedStudents = async () => {
      if (selectedStudents.value.length === 0) return;

      try {
        // Reset progress - Start at 1%
        exportProgress.value = 1;
        exportStage.value = "";
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Clear previous refs
        cardRefs.value = [];

        // This is My last Changes Here: Stage 1 - Initial setup (1-5%) with delays for visibility
        exportProgress.value = 3;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Make render area visible for image loading
        const renderArea = document.querySelector(
          ".pdf-render-area"
        ) as HTMLElement;
        if (renderArea) {
          renderArea.style.visibility = "visible";
          renderArea.style.opacity = "1";
          renderArea.style.position = "absolute";
          renderArea.style.top = "-5000px"; // Keep off-screen but visible to browser
          renderArea.style.left = "-5000px";
        }

        // This is My last Changes Here: Progress update to 5%
        exportProgress.value = 5;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Use requestAnimationFrame for faster rendering
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(undefined))
        );

        // This is My last Changes Here: Reduced wait time from 1000ms to 300ms
        await new Promise((resolve) => setTimeout(resolve, 300));

        // This is My last Changes Here: Stage 2 - Component preparation (5-10%)
        exportProgress.value = 8;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Progress update to 10%
        exportProgress.value = 10;
        exportStage.value = "";
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get front and back elements for each selected student
        const frontElements: HTMLElement[] = [];
        const backElements: HTMLElement[] = [];

        cardRefs.value.forEach((cardRef, index) => {
          if (cardRef.$refs) {
            const frontEl = cardRef.$refs.idFrontRef as HTMLElement;
            const backEl = cardRef.$refs.idBackRef as HTMLElement;
            if (frontEl && backEl) {
              frontElements.push(frontEl);
              backElements.push(backEl);
            } else {
              console.warn(`Missing elements for student ${index + 1}:`, {
                front: !!frontEl,
                back: !!backEl,
              });
            }
          } else {
            console.warn(`No refs found for card ${index + 1}`);
          }
        });

        if (frontElements.length === 0 || backElements.length === 0) {
          console.error("No card elements found for PDF generation");
          return;
        }

        // This is My last Changes Here: Stage 3 - Collecting elements (10-15%)
        exportProgress.value = 12;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Progress update to 15%
        exportProgress.value = 15;
        await new Promise((resolve) => setTimeout(resolve, 100));

        // This is My last Changes Here: PDF generation with progress callback (15-85%)
        const pdfDataUri = await generateBatchStudentIdPdf(
          selectedStudentsData.value,
          frontElements,
          backElements,
          (current: number, total: number) => {
            // Progress callback: 15% to 85% based on students processed (70% range)
            const progressPercent = 15 + Math.round((current / total) * 70);
            exportProgress.value = progressPercent;
            exportStage.value = `(${current}/${total})`;
          }
        );

        // This is My last Changes Here: Final stages with smooth progress (85-100%)
        // This is My last Changes Here: Stage 4 - Finalizing PDF (85-95%)
        exportProgress.value = 88;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Progress update to 92%
        exportProgress.value = 92;
        await new Promise((resolve) => setTimeout(resolve, 150));
        exportStage.value = "";

        // This is My last Changes Here: Stage 5 - Download preparation (95-100%)
        exportProgress.value = 95;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Create download link
        const link = document.createElement("a");
        link.href = pdfDataUri;
        link.download = `student_ids_batch_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`;

        // This is My last Changes Here: Progress update to 98%
        exportProgress.value = 98;
        await new Promise((resolve) => setTimeout(resolve, 150));

        // This is My last Changes Here: Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // This is My last Changes Here: Complete at 100%
        exportProgress.value = 100;
        exportStage.value = "";

        // This is My last Changes Here: Keep at 100% for 800ms before closing
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (error) {
        console.error("Error generating batch PDF:", error);
      } finally {
        // Reset render area visibility
        const renderArea = document.querySelector(
          ".pdf-render-area"
        ) as HTMLElement;
        if (renderArea) {
          renderArea.style.visibility = "hidden";
          renderArea.style.opacity = "0";
          renderArea.style.top = "-10000px";
          renderArea.style.left = "-10000px";
        }
      }
    };

    return {
      model,
      studentData,
      selectedStudents,
      loading,
      totalStudents,
      selectAll,
      selectedStudentsData,
      isGeneratingPdf,
      options,
      selectedSection,
      search,
      // Section filter
      sectionOptions,
      selectedSectionFilter,
      loadingSections,
      // Pagination
      currentPage,
      totalPages,
      allStudents,
      isLoadingAll,
      hasLoadedAll,
      // This is My last Changes Here: Export progress states
      exportProgress,
      exportStage,
      // Functions
      fetchStudentData,
      loadAllStudents,
      toggleSelectAll,
      setCardRef,
      exportSelectedStudents,
    };
  },
});
</script>

<style scoped>
.content {
  border-top: 1px solid var(--q-light);
  /* This is My last Changes Here: Content max height */
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--q-outline-variant) var(--q-surface-variant); /* Firefox */
}

/* This is My last Changes Here: Selection controls */
.selection-controls {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.student-card {
  border: 2px solid var(--q-light);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 400px; /* Increase height to accommodate 0.6 scaled cards */
  overflow: visible; /* Ensure content isn't clipped */

  &:hover {
    border-color: var(--q-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: var(--q-primary);
    background-color: rgba(25, 118, 210, 0.05);
  }
}

.student-checkbox {
  margin-bottom: 8px;
}

.student-preview {
  display: flex;
  flex-direction: column;
}

.student-info {
  text-align: center;
}

.student-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--q-dark);
  margin-bottom: 4px;
}

.student-details {
  font-size: 12px;
  color: var(--q-grey-7);
}

.id-preview {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: flex-start;
  min-height: 300px;
  padding: 8px;
}

.btn-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--q-light);
  background: white;
}

.pdf-render-area {
  position: absolute;
  top: -10000px;
  left: -10000px;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
</style>
