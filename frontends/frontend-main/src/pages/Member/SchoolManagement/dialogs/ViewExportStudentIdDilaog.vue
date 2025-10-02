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
          Export Student ID
        </div>
        <q-space />
        <div class="text-body-medium text-dark q-mr-md">
          {{ selectedStudents.length }} of {{ totalStudents }} selected
        </div>
        <g-button flat round dense icon-size="md" icon="close" v-close-popup />
      </q-card-section>

      <div class="content q-pa-md">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner-dots size="50px" color="primary" />
          <div class="q-ml-md text-h6">Loading students...</div>
        </div>

        <div v-else-if="studentData?.list?.length">
          <!-- Pagination Controls -->
          <div class="pagination-controls q-pa-md bg-grey-1 rounded-borders">
            <div class="row items-center">
              <div class="text-body-medium">
                Page {{ currentPage }} of {{ totalPages }}
                ({{ studentData?.list?.length || 0 }} students on this page)
              </div>
              <q-space />
              <g-button
                :disabled="currentPage <= 1"
                @click="fetchStudentData(currentPage - 1)"
                icon="chevron_left"
                flat
                round
                dense
                color="primary"
              />
              <span class="q-mx-sm">{{ currentPage }} / {{ totalPages }}</span>
              <g-button
                :disabled="currentPage >= totalPages"
                @click="fetchStudentData(currentPage + 1)"
                icon="chevron_right"
                flat
                round
                dense
                color="primary"
              />
              <g-button
                @click="loadAllStudents"
                :loading="isLoadingAll"
                :disabled="isLoadingAll"
                label="Load All Students"
                color="secondary"
                variant="outline"
                class="q-ml-md"
              />
            </div>
          </div>

          <!-- Loading indicator for all students -->
          <div v-if="isLoadingAll" class="text-center q-pa-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="text-h6">Loading all students...</div>
            <div class="text-body-medium">{{ allStudents.length }} students loaded so far</div>
          </div>

          <!-- Selection Controls -->
          <div class="selection-controls q-mb-md">
            <q-checkbox
              v-model="selectAll"
              label="Select All (on this page)"
              @update:model-value="toggleSelectAll"
            />
            <q-space />
            <div class="text-body-medium">{{ totalStudents }} students showing</div>
          </div>

          <!-- Student Grid -->
          <div class="student-grid">
            <div
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
                  <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                  <div class="student-details">{{ student.lrn }} | {{ student.section?.name }}</div>
                </div>
                <student-id-card
                  :student-data="student"
                  :preview="true"
                  class="id-preview"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-center q-pa-xl">
          <q-icon name="school" size="50px" color="grey" />
          <div class="q-ml-md text-h6 text-grey">No students found</div>
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
        <g-button
          :disabled="selectedStudents.length === 0 || isGeneratingPdf"
          :loading="isGeneratingPdf"
          @click="exportSelectedStudents"
          label="Export Selected"
          icon="o_download"
          icon-size="md"
          color="primary"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import GButton from "src/components/shared/buttons/GButton.vue";
import StudentIdCard from "./StudentIdCard.vue";
import { defineComponent, computed, ref, getCurrentInstance } from "vue";
import type { StudentResponse } from "@shared/response";
import { useStudentIdPdf } from "src/composables/useStudentIdPdf";

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

    // Pagination state
    const currentPage = ref(1);
    const totalPages = ref(0);
    const perPage = ref(100);
    const allStudents = ref<StudentResponse[]>([]);
    const isLoadingAll = ref(false);

    // PDF generation
    const { isGenerating: isGeneratingPdf, generateBatchStudentIdPdf } = useStudentIdPdf();

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
        return currentList.length > 0 &&
               currentList.every(student => selectedStudents.value.includes(student.id));
      },
      set: (value: boolean) => {
        if (value) {
          // Only select students on current page/view
          const currentIds = (studentData.value?.list || []).map(s => s.id);
          selectedStudents.value = [...new Set([...selectedStudents.value, ...currentIds])];
        } else {
          // Deselect students on current page/view
          const currentIds = (studentData.value?.list || []).map(s => s.id);
          selectedStudents.value = selectedStudents.value.filter(id => !currentIds.includes(id));
        }
      },
    });

    const selectedStudentsData = computed(() => {
      return studentData.value?.list?.filter(student =>
        selectedStudents.value.includes(student.id)
      ) || [];
    });

    const fetchStudentData = async (page = 1, append = false) => {
      loading.value = true;

      // Preload images on first load
      if (page === 1 && !append) {
        await preloadImages();
      }

      try {
        const response = await $api.put(`school/student/table?page=${page}&perPage=${perPage.value}`, {
          filter: {},
          sort: { createdAt: 'desc' },
          include: ['workflowInstance.currentStage'],
        });

        if (append) {
          // Appending for "Load All"
          allStudents.value = [...allStudents.value, ...response.data.list];
        } else {
          // Regular page load
          studentData.value = response.data;
          currentPage.value = response.data.currentPage || page;
          // Clear selections when changing pages
          selectedStudents.value = [];
        }

        // Extract total pages from pagination array
        if (response.data.pagination && Array.isArray(response.data.pagination)) {
          const lastPage = response.data.pagination.filter(p => typeof p === 'number').pop();
          totalPages.value = lastPage || 1;
        }

        console.log("studentData.value", studentData.value);
        console.log("Total pages:", totalPages.value);
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
        console.log(`Loaded all ${allStudents.value.length} students`);
      } catch (error) {
        console.error("Error loading all students:", error);
      } finally {
        isLoadingAll.value = false;
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

    const preloadImages = async () => {
      const imagesToPreload = [
        '/FRONT_BG with BLEED.png',
        '/BACK_BG with BLEED.png',
        '/sample-picture.png',
        '/elem-signatorist.png',
        '/hs-signatorist.png',
        '/college-employee-signatorist.png'
      ];

      // Preload static images
      const staticImagePromises = imagesToPreload.map(src => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            console.log("Static image preloaded:", src);
            resolve();
          };

          img.onerror = () => {
            console.error("Failed to preload static image:", src);
            resolve(); // Continue even if one fails
          };

          img.src = src;
        });
      });

      // Preload student profile photos using image proxy for external URLs
      const profilePhotoPromises = selectedStudents.value.map(async (student) => {
        if (student.profilePhoto?.url) {
          try {
            // Use image proxy to convert external URLs to safe data URLs
            const { getSafeImageUrl } = await import('src/utils/imageProxy');
            const safeUrl = await getSafeImageUrl(student.profilePhoto.url, '/sample-picture.png');

            return new Promise<void>((resolve) => {
              const img = new Image();

              img.onload = () => {
                console.log("Profile photo preloaded via proxy:", {
                  original: student.profilePhoto?.url,
                  converted: safeUrl.startsWith('data:') ? 'data URL' : safeUrl
                });
                resolve();
              };

              img.onerror = () => {
                console.error("Failed to preload profile photo:", student.profilePhoto?.url);
                resolve(); // Continue even if one fails
              };

              img.src = safeUrl;
            });
          } catch (error) {
            console.error("Error processing profile photo with proxy:", error);
            return Promise.resolve();
          }
        }
        return Promise.resolve();
      });

      try {
        await Promise.all([...staticImagePromises, ...profilePhotoPromises]);
        console.log("All images preloaded successfully");
      } catch (error) {
        console.error("Error preloading images:", error);
      }
    };

    const exportSelectedStudents = async () => {
      if (selectedStudents.value.length === 0) return;

      try {
        console.log('Starting PDF export for', selectedStudents.value.length, 'students');

        // Preload all images first including student profile photos
        console.log('Preloading images...');
        try {
          await preloadImages();
        } catch (error) {
          console.warn('Some images failed to preload, continuing with PDF generation:', error);
          // Continue with PDF generation even if some images fail to preload
        }

        // Clear previous refs
        cardRefs.value = [];

        // Wait for next tick to ensure components are rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        // Temporarily make the render area visible to ensure images load
        const renderArea = document.querySelector('.pdf-render-area') as HTMLElement;
        if (renderArea) {
          console.log('Making render area visible for image loading');
          renderArea.style.visibility = 'visible';
          renderArea.style.opacity = '1';
          renderArea.style.position = 'absolute';
          renderArea.style.top = '-5000px'; // Keep off-screen but visible to browser
          renderArea.style.left = '-5000px';
        }

        // Wait longer for components and images to load
        console.log('Waiting for component rendering...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get front and back elements for each selected student
        const frontElements: HTMLElement[] = [];
        const backElements: HTMLElement[] = [];

        cardRefs.value.forEach((cardRef, index) => {
          if (cardRef.$refs) {
            const frontEl = cardRef.$refs.idFrontRef as HTMLElement;
            const backEl = cardRef.$refs.idBackRef as HTMLElement;
            if (frontEl && backEl) {
              console.log(`Found elements for student ${index + 1}:`, {
                front: frontEl.offsetWidth,
                back: backEl.offsetWidth,
                profilePhoto: selectedStudentsData.value[index]?.profilePhoto?.url
              });
              frontElements.push(frontEl);
              backElements.push(backEl);
            } else {
              console.warn(`Missing elements for student ${index + 1}:`, { front: !!frontEl, back: !!backEl });
            }
          } else {
            console.warn(`No refs found for card ${index + 1}`);
          }
        });

        if (frontElements.length === 0 || backElements.length === 0) {
          console.error("No card elements found for PDF generation");
          return;
        }

        console.log(`Found ${frontElements.length} front elements and ${backElements.length} back elements`);

        // Generate batch PDF
        console.log('Starting PDF generation...');
        const pdfDataUri = await generateBatchStudentIdPdf(
          selectedStudentsData.value,
          frontElements,
          backElements
        );

        console.log('PDF generated successfully');

        // Download PDF
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = `student_ids_batch_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (error) {
        console.error("Error generating batch PDF:", error);
      } finally {
        // Reset render area visibility
        const renderArea = document.querySelector('.pdf-render-area') as HTMLElement;
        if (renderArea) {
          renderArea.style.visibility = 'hidden';
          renderArea.style.opacity = '0';
          renderArea.style.top = '-10000px';
          renderArea.style.left = '-10000px';
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
      // Pagination
      currentPage,
      totalPages,
      allStudents,
      isLoadingAll,
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
  max-height: calc(100vh - 135px);
  overflow-y: auto;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--q-outline-variant) var(--q-surface-variant); /* Firefox */
}

.selection-controls {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--q-light);
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
  justify-content: flex-end;
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
