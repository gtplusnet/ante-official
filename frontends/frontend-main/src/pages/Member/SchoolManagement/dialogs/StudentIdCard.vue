<template>
  <div class="student-id-card" :class="{ 'preview-mode': preview }">
    <div ref="idFrontRef" class="id-front">
      <img src="/FRONT_BG with BLEED.png" alt="" />
      <div class="profile-container">
        <div class="profile-image">
          <img
            :src="profileImageUrl"
            :alt="`${studentData.firstName} ${studentData.lastName} profile photo`"
            loading="eager"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div v-if="isLoadingImage" class="image-loading">
            <q-spinner size="20px" color="primary" />
          </div>
        </div>
      </div>
      <div class="student-name">
        {{ studentData.firstName }}
        {{ studentData.middleName ? studentData.middleName + " " : ""
        }}{{ studentData.lastName }}
      </div>
      <div class="student-lrn">{{ studentData.lrn }}</div>
      <div class="student-grade">
        {{ studentData.section.gradeLevel.name }}
      </div>
      <div class="student-section">
        {{ formattedSectionName }}
      </div>
      <div class="student-qr-code">
        <qrcode-vue
          :value="`student:${studentData.id}`"
          :size="115"
          level="M"
          render-as="svg"
        />
      </div>
    </div>

    <div ref="idBackRef" class="id-back">
      <img src="/BACK_BG with BLEED.png" alt="" />
      <div
        v-if="studentData.section.gradeLevel.educationLevel === 'COLLEGE'"
        class="college-signatorist"
        style="background-image: url('/college-employee-signatorist.png')"
      ></div>
      <div
        v-else-if="
          studentData.section.gradeLevel.educationLevel === 'ELEMENTARY'
        "
        class="elem-signatorist"
        style="background-image: url('/elem-signatorist.png')"
      ></div>
      <div
        v-else-if="
          studentData.section.gradeLevel.educationLevel === 'JUNIOR_HIGH' ||
          studentData.section.gradeLevel.educationLevel === 'SENIOR_HIGH'
        "
        class="hs-signatorist"
        style="background-image: url('/hs-signatorist.png')"
      ></div>
      <div class="person-emergency" :class="{ 'multiple-contacts': hasMultipleContacts }">
        <div class="row">
          <div class="label">Name:</div>
          <div class="value">{{ emergencyContactName }}</div>
        </div>
        <div class="row">
          <div class="label">Address:</div>
          <div class="value">{{ emergencyContactAddress }}</div>
        </div>
        <div class="row">
          <div class="label">Mobile No.:</div>
          <div class="value">{{ emergencyContactMobile }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import defaultStudentImage from "src/assets/default-student.svg";
import { defineComponent, computed, ref, onMounted, watch } from "vue";
import QrcodeVue from "qrcode.vue";
import type { StudentResponse } from "@shared/response";

export default defineComponent({
  name: "StudentIdCard",
  components: {
    QrcodeVue,
  },
  props: {
    studentData: {
      type: Object as () => StudentResponse,
      required: true,
    },
    preview: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const formattedSectionName = computed(() => {
      if (!props.studentData?.section?.name) return "";

      // Remove "STEM - " or any prefix before " - "
      let sectionName = props.studentData.section.name;
      if (sectionName.includes(" - ")) {
        sectionName = sectionName.split(" - ")[1];
      }

      // Convert to title case (capitalize first letter of each word)
      return sectionName
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });

    // Computed properties for dynamic data
    const emergencyContactName = computed(() => {
      const names = [];

      // Add guardian name if available
      if (props.studentData?.guardian?.name) {
        names.push(props.studentData.guardian.name);
      }

      // Add temporary guardian name if available and different
      if (props.studentData?.temporaryGuardianName &&
          props.studentData.temporaryGuardianName !== props.studentData?.guardian?.name) {
        names.push(props.studentData.temporaryGuardianName);
      }

      return names.length > 0 ? names.join(" / ") : "Not available";
    });

    const emergencyContactAddress = computed(() => {
      // Try to get location address or guardian address, fallback to "Not available"
      const location = props.studentData?.location;
      if (location) {
        const parts = [];
        if (location.street) parts.push(location.street);
        if (location.barangay) parts.push(location.barangay);
        if (location.city) parts.push(location.city);
        if (location.province) parts.push(location.province);
        return parts.length > 0 ? parts.join(", ") : "Not available";
      }
      return props.studentData?.guardian?.address || props.studentData?.temporaryGuardianAddress || "Not available";
    });

    const emergencyContactMobile = computed(() => {
      const numbers = [];

      // Add guardian contact number if available
      if (props.studentData?.guardian?.contactNumber) {
        numbers.push(props.studentData.guardian.contactNumber);
      }

      // Add temporary guardian contact if available and different
      if (props.studentData?.temporaryGuardianContactNumber &&
          props.studentData.temporaryGuardianContactNumber !== props.studentData?.guardian?.contactNumber) {
        numbers.push(props.studentData.temporaryGuardianContactNumber);
      }

      return numbers.length > 0 ? numbers.join(" / ") : "Not available";
    });

    // Check if there are multiple contacts (for conditional styling)
    const hasMultipleContacts = computed(() => {
      return emergencyContactName.value.includes(" / ");
    });

    // Template refs for PDF generation
    const idFrontRef = ref<HTMLElement>();
    const idBackRef = ref<HTMLElement>();

    // Safe profile image URL for PDF generation
    const safeProfileImageUrl = ref<string>(defaultStudentImage);
    const isLoadingImage = ref<boolean>(false);

    // Use direct profile photo URLs without conversion
    const updateProfileImage = async () => {
      const profilePhotoUrl = props.studentData.profilePhoto?.url;

      if (!profilePhotoUrl) {
        console.log("[StudentIdCard] No profile photo URL, using default");
        safeProfileImageUrl.value = defaultStudentImage;
        return;
      }

      // Use direct URL without any conversion
      console.log(
        "[StudentIdCard] Using direct profile photo URL:",
        profilePhotoUrl
      );
      safeProfileImageUrl.value = profilePhotoUrl;
      isLoadingImage.value = false;
    };

    // Watch for changes in student data profile photo
    watch(
      () => props.studentData.profilePhoto?.url,
      () => {
        updateProfileImage();
      },
      { immediate: true }
    );

    // Update profile image on mount
    onMounted(() => {
      updateProfileImage();
    });

    // Computed property that just returns the current safe URL
    const profileImageUrl = computed(() => {
      return safeProfileImageUrl.value;
    });

    // Image event handlers
    const onImageLoad = () => {
      console.log("[StudentIdCard] Image loaded successfully");
      isLoadingImage.value = false;
    };

    const onImageError = (event: Event) => {
      const img = event.target as HTMLImageElement;
      console.error("[StudentIdCard] Image failed to load:", {
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        crossOrigin: img.crossOrigin,
      });

      console.error(
        "[StudentIdCard] This is likely a CORS issue. The DigitalOcean Spaces bucket needs CORS configuration to allow your domain."
      );

      if (img.src !== defaultStudentImage) {
        console.log("[StudentIdCard] Falling back to default image");
        img.src = defaultStudentImage;
      }
      isLoadingImage.value = false;
    };

    return {
      formattedSectionName,
      emergencyContactName,
      emergencyContactAddress,
      emergencyContactMobile,
      hasMultipleContacts,
      idFrontRef,
      idBackRef,
      defaultStudentImage,
      profileImageUrl,
      isLoadingImage,
      onImageLoad,
      onImageError,
    };
  },
});
</script>

<style lang="scss" scoped>
.student-id-card {
  &.preview-mode {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;

    .id-front,
    .id-back {
      position: absolute;
      transform: scale(0.5);
    }

    .id-front {
      left: -10%;
    }

    .id-back {
      right: -10%;
    }
  }
}

.id-front {
  position: relative;
  background-color: #ffffff;

  .profile-container {
    position: absolute;
    top: 113px;
    left: 96px;
    width: 130px;
    height: 130px;
    // background-color: #edeeea;
    // border-left: solid 4px #fabe11;
    // border-bottom: solid 4px #fabe11;
    // border-top: solid 4px #861a1d;
    // border-right: solid 4px #861a1d;
    transform: rotate(45deg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // Add inner element for image
  .profile-image {
    width: 130px;
    height: 130px;
    mix-blend-mode: darken;
    position: absolute;
    top: 0;
    left: 0;
    background-color: #edeeea;
    border-left: solid 4px #fabe11;
    border-bottom: solid 4px #fabe11;
    border-top: solid 4px #861a1d;
    border-right: solid 4px #861a1d;
    overflow: hidden;

    img {
      transform: rotate(-45deg);
      margin-top: -5px;
      margin-left: -5px;
      position: absolute;
      width: 150px;
      height: 150px;
      box-shadow: none;
    }
  }

  .student-name {
    position: absolute;
    text-transform: uppercase;
    width: 90%;
    bottom: 94.5px;
    left: 50%;
    transform: translate(-50%, -94.5px) scaleY(2.4);
    font-size: 11px;
    font-weight: bold;
    color: #541d23;
    text-align: center;
    letter-spacing: 1px;
  }

  .student-lrn {
    position: absolute;
    text-transform: uppercase;
    bottom: 137px;
    left: 63px;
    font-size: 13.5px;
    font-weight: bold;
    line-height: 1;
    color: #fff;
  }

  .student-grade {
    position: absolute;
    text-transform: uppercase;
    bottom: 115px;
    left: 31px;
    font-size: 14px;
    font-weight: bold;
    color: #fff;
  }

  .student-section {
    position: absolute;
    width: 40%;
    text-transform: uppercase;
    bottom: 81px;
    left: 31px;
    font-size: 14px;
    font-weight: bold;
    line-height: 1.2;
    color: #fff;
    min-height: 34px; // Minimum height for consistent positioning
    display: flex;
  }

  .student-qr-code {
    position: absolute;
    bottom: 45px;
    right: 38px;
  }
}

.id-back {
  position: relative;
  background-color: #ffffff;

  .elem-signatorist {
    position: absolute;
    bottom: 17%;
    left: 50%;
    transform: translate(-50%, -17%);
    width: 130px;
    height: 130px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .hs-signatorist {
    position: absolute;
    bottom: 17%;
    left: 50%;
    transform: translate(-50%, -17%);
    width: 130px;
    height: 130px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .college-signatorist {
    position: absolute;
    bottom: 8%;
    left: 50%;
    transform: translate(-50%, -8%);
    width: 220px;
    height: 220px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .person-emergency {
    height: 64px;
    position: absolute;
    top: 78px;
    left: 39px;
    line-height: 1.3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2px;

    .label {
      width: 60px;
      color: #fec609;
      font-weight: bold;
      font-size: 11px;
      text-align: right;

      &:nth-child(1) {
        margin-bottom: -5px;
      }
    }

    .value {
      width: 180px;
      font-weight: bold;
      font-size: 11px;
      color: #fff;
      margin-left: 5px;
      line-height: 1.2;
    }

    // When there are multiple contacts, use smaller font and narrower label
    &.multiple-contacts {
      gap: 0;

      .label {
        width: 55px;
        font-size: 10px;
      }

      .value {
        width: 185px;
        padding-top: 1px;
        font-size: 10px;
      }
    }
  }
}

.id-front img,
.id-back img {
  width: 324px; // 3.375 inches at 96 DPI (standard ID card width)
  height: 484px; // Maintains aspect ratio for 756x1129 images
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
