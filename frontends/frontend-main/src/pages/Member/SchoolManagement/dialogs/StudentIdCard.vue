<template>
  <div class="student-id-card" :class="{ 'preview-mode': preview }">
    <div ref="idFrontRef" class="id-front">
      <img src="/front-id.png" alt="" />
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
      <div class="student-name" :class="{ 'long-name': hasLongFirstName }">
        {{ studentData.firstName }}
        {{ formattedMiddleName ? formattedMiddleName + " " : ""
        }}{{ studentData.lastName }}
      </div>
      <div class="student-lrn">{{ studentData.lrn }}</div>
      <div class="student-grade" :class="{ 'long-grade': hasLongSectionName }">
        {{ studentData.section.gradeLevel.name }}
      </div>
      <div class="student-section" :class="{ 'long-section': hasLongSectionName }">
        {{ abbreviatedSectionName }}
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
      <img
        src="images/back-ec.png"
        alt=""
        v-if="studentData.section.gradeLevel.educationLevel === 'COLLEGE'"
      />
      <img
        src="images/back-jhsh.png"
        alt=""
        v-else-if="
          studentData.section.gradeLevel.educationLevel === 'JUNIOR_HIGH' ||
          studentData.section.gradeLevel.educationLevel === 'SENIOR_HIGH'
        "
      />
      <img
        src="images/back-elem.png"
        alt=""
        v-else-if="
          studentData.section.gradeLevel.educationLevel === 'ELEMENTARY' ||
          studentData.section.gradeLevel.educationLevel === 'NURSERY' ||
          studentData.section.gradeLevel.educationLevel === 'PRE-SCHOOL' ||
          studentData.section.gradeLevel.educationLevel === 'KINDERGARTEN'
        "
      />

      <!-- <div
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
      ></div> -->
      <div
        class="person-emergency"
        :class="{ 'multiple-contacts': hasMultipleContacts }"
      >
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
    // This is My Last Changes Here - Middle Name Formatter
    const formattedMiddleName = computed(() => {
      if (!props.studentData?.middleName) return "";

      const middleName = props.studentData.middleName.trim();

      // If already formatted as initials (e.g., 'DC.' or 'D.C.' or 'D.A'), return as-is
      // Must have dots to be considered already formatted
      if (/^[A-Z]\.\s?[A-Z]\.?$|^[A-Z]\.([A-Z]\.)*$|^[A-Z]{2,}\.$|^[A-Z]\.[A-Z]$/i.test(middleName)) {
        return middleName;
      }

      // Handle multi-word middle names (e.g., "Dela Cruz" -> "DC.")
      const words = middleName.split(/\s+/);
      if (words.length > 1) {
        return words.map((word: string) => word.charAt(0).toUpperCase()).join("") + ".";
      }

      // Single word middle name (e.g., "Maria" -> "M.")
      return middleName.charAt(0).toUpperCase() + ".";
    });

    // This is My Last Changes Here - Check if first name has 3 or more words for smaller font
    const hasLongFirstName = computed(() => {
      if (!props.studentData?.firstName) return false;
      const words = props.studentData.firstName.trim().split(/\s+/);
      return words.length >= 3;
    });

    // Abbreviate course name for COLLEGE level
    const abbreviatedSectionName = computed(() => {
      if (!props.studentData?.section) return '';

      const educationLevel = props.studentData.section.gradeLevel.educationLevel;
      const sectionName = props.studentData.section.name;

      // Only abbreviate for COLLEGE level
      if (educationLevel !== 'COLLEGE') {
        return sectionName;
      }

      // Split by " - " to separate course from section name
      const parts = sectionName.split(' - ');
      const courseName = parts[0];
      const sectionPart = parts.slice(1).join(' - '); // In case there are multiple hyphens

      // Words to skip in abbreviation
      const skipWords = ['OF', 'IN', 'THE', 'AND'];

      // Split course name into words and create abbreviation
      const words = courseName.trim().split(/\s+/);
      const abbreviation = words
        .filter((word: string) => !skipWords.includes(word.toUpperCase()))
        .map((word: string) => word.charAt(0).toUpperCase())
        .join('');

      // Rejoin with section name if present
      return sectionPart ? `${abbreviation} - ${sectionPart}` : abbreviation;
    });

    // Check if section name has more than 5 words for smaller font
    const hasLongSectionName = computed(() => {
      const sectionName = abbreviatedSectionName.value;
      if (!sectionName) return false;
      const words = sectionName.trim().split(/\s+/);
      return words.length > 3;
    });

    // Computed properties for dynamic data
    const emergencyContactName = computed(() => {
      const names = [];

      // Add guardian name if available
      if (props.studentData?.guardian?.name) {
        names.push(props.studentData.guardian.name);
      }

      // Add temporary guardian name if available and different
      if (
        props.studentData?.temporaryGuardianName &&
        props.studentData.temporaryGuardianName !==
          props.studentData?.guardian?.name
      ) {
        names.push(props.studentData.temporaryGuardianName);
      }

      const fullName = names.length > 0 ? names.join(" / ") : "Not available";
      // If there are multiple names separated by "/", take only the first one
      return fullName.includes(" / ")
        ? fullName.split(" / ")[0].trim()
        : fullName;
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
      return (
        props.studentData?.guardian?.address ||
        props.studentData?.temporaryGuardianAddress ||
        "Not available"
      );
    });

    const emergencyContactMobile = computed(() => {
      const numbers = [];

      // Add guardian contact number if available
      if (props.studentData?.guardian?.contactNumber) {
        numbers.push(props.studentData.guardian.contactNumber);
      }

      // Add temporary guardian contact if available and different
      if (
        props.studentData?.temporaryGuardianContactNumber &&
        props.studentData.temporaryGuardianContactNumber !==
          props.studentData?.guardian?.contactNumber
      ) {
        numbers.push(props.studentData.temporaryGuardianContactNumber);
      }

      const fullNumber =
        numbers.length > 0 ? numbers.join(" / ") : "Not available";
      // If there are multiple numbers separated by "/", take only the first one
      return fullNumber.includes(" / ")
        ? fullNumber.split(" / ")[0].trim()
        : fullNumber;
    });

    // Check if there are multiple contacts (for conditional styling)
    const hasMultipleContacts = computed(() => {
      // Check if name has multiple contacts
      if (emergencyContactName.value.includes(" / ")) {
        return true;
      }

      // Check if address has 10 or more words
      const addressWords = emergencyContactAddress.value.trim().split(/\s+/);
      if (addressWords.length >= 10) {
        return true;
      }

      return false;
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
      formattedMiddleName,
      hasLongFirstName,
      abbreviatedSectionName,
      hasLongSectionName,
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
      margin-left: -170px;
    }

    .id-back {
      margin-right: -170px;
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
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      width: 160px;
      height: 160px;
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

    // This is My Last Changes Here
    &.long-name {
      font-size: 10px; 
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      letter-spacing: 1px;
    }
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

    &.long-grade {
      font-size: 12px;
      bottom: 117px;
    }
  }

  .student-section {
    position: absolute;
    width: 40%;
    text-transform: uppercase;
    bottom: 83px;
    left: 31px;
    font-size: 14px;
    font-weight: bold;
    line-height: 1.2;
    color: #fff;
    min-height: 34px; // Minimum height for consistent positioning
    display: flex;

    &.long-section {
      font-size: 12px;
      line-height: 1.4;
      bottom: 83px;
    }
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
      font-size: 10px;
      text-align: right;

      &:nth-child(1) {
        margin-bottom: -5px;
      }
    }

    .value {
      width: 180px;
      font-weight: bold;
      font-size: 10px;
      color: #fff;
      margin-left: 5px;
      line-height: 1.2;
    }

    // When there are multiple contacts, use smaller font and narrower label
    &.multiple-contacts {
      gap: 0;

      .label {
        width: 55px;
        font-size: 9px;
      }

      .value {
        width: 185px;
        padding-top: 1px;
        font-size: 9px;
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
