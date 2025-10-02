import { ref } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { StudentResponse } from "@shared/response";

export function useStudentIdPdf() {
  const isGenerating = ref(false);
  const pdfDataUrl = ref<string>("");

  const generateStudentIdPdf = async (
    frontElement: HTMLElement,
    backElement: HTMLElement,
    studentData: StudentResponse
  ): Promise<string> => {
    isGenerating.value = true;

    try {
      // Wait for images to load
      await waitForImages([frontElement, backElement]);

      // Capture front and back of ID card
      // Updated configuration for direct URL images
      const frontCanvas = await html2canvas(frontElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false, // Changed to false to allow external images
        backgroundColor: "#ffffff",
        logging: true, // Enable logging to debug image loading
        imageTimeout: 15000, // 15 second timeout for image loading
        width: 756, // Match current CSS width
        height: 1129, // Match current CSS height
      });

      const backCanvas = await html2canvas(backElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false, // Changed to false to allow external images
        backgroundColor: "#ffffff",
        logging: true, // Enable logging to debug image loading
        imageTimeout: 15000, // 15 second timeout for image loading
        width: 756, // Match current CSS width
        height: 1129, // Match current CSS height
      });

      // Create PDF with standard ID card dimensions
      // Standard ID card: 85.6mm x 53.98mm (3.375" x 2.125")
      // Using A4 landscape to fit multiple IDs
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit nicely on A4
      const cardWidth = 200.025; // mm - standard ID width
      const cardHeight = 298.71458333; // mm - proportional height for our design
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Center the cards on the page
      const margin = 20;
      const startX = (pageWidth - cardWidth) / 2;
      const frontY = margin;
      const backY = frontY + cardHeight + 20; // 20mm gap between front and back

      // Add title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Student ID Card", pageWidth / 2, 15, { align: "center" });

      // Add student name
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const studentName = `${studentData.firstName} ${studentData.middleName ? studentData.middleName + " " : ""}${
        studentData.lastName
      }`;
      pdf.text(studentName, pageWidth / 2, 25, { align: "center" });

      // Add front of ID
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("FRONT", startX, frontY - 5);

      const frontImgData = frontCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(frontImgData, "JPEG", startX, frontY, cardWidth, cardHeight);

      // Add back of ID (if it fits on the same page)
      if (backY + cardHeight <= pageHeight - margin) {
        pdf.text("BACK", startX, backY - 5);
        const backImgData = backCanvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(backImgData, "JPEG", startX, backY, cardWidth, cardHeight);
      } else {
        // Add new page for back
        pdf.addPage();
        pdf.text("BACK", startX, frontY - 5);
        const backImgData = backCanvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(backImgData, "JPEG", startX, frontY, cardWidth, cardHeight);
      }

      // Add footer with generation timestamp
      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      // Get PDF as data URL
      const pdfDataUri = pdf.output("datauristring");
      pdfDataUrl.value = pdfDataUri;

      return pdfDataUri;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF");
    } finally {
      isGenerating.value = false;
    }
  };

  const downloadPdf = (pdfDataUri: string, studentData: StudentResponse) => {
    const studentName = `${studentData.firstName}_${studentData.lastName}`;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `student_id_${studentName}_${timestamp}.pdf`;

    // Create download link
    const link = document.createElement("a");
    link.href = pdfDataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPdf = (pdfDataUri: string) => {
    // Open PDF in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Student ID Card</title>
            <style>
              body { margin: 0; padding: 0; }
              iframe { border: none; width: 100%; height: 100vh; }
            </style>
          </head>
          <body>
            <iframe src="${pdfDataUri}" type="application/pdf"></iframe>
          </body>
        </html>
      `);
      printWindow.document.close();

      // Auto-focus and print
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const waitForImages = async (elements: HTMLElement[]): Promise<void> => {
    const promises: Promise<void>[] = [];

    elements.forEach((element) => {
      // Handle regular img elements
      const images = element.querySelectorAll("img");
      images.forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) {
          promises.push(
            new Promise((resolve) => {
              const timeout = setTimeout(() => {
                console.warn("Image load timeout for:", img.src);
                resolve();
              }, 10000); // Increased timeout to 10 seconds

              img.onload = () => {
                clearTimeout(timeout);
                console.log("Image loaded successfully:", img.src);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                console.error("Failed to load image:", img.src);
                resolve(); // Resolve even on error to prevent hanging
              };

              // If image has src but not loaded, try to reload it
              if (img.src && img.naturalWidth === 0) {
                const originalSrc = img.src;
                img.src = "";
                img.src = originalSrc;
              }
            })
          );
        }
      });

      // Handle background images from CSS
      const elementsWithBgImages = element.querySelectorAll("*");
      elementsWithBgImages.forEach((el) => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;

        if (bgImage && bgImage !== "none" && bgImage.includes("url(")) {
          // Extract URL from background-image CSS
          const matches = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
          if (matches && matches[1]) {
            const imgUrl = matches[1];
            console.log("Found background image:", imgUrl);

            promises.push(
              new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Enable CORS for background images

                const timeout = setTimeout(() => {
                  console.warn("Background image load timeout for:", imgUrl);
                  resolve();
                }, 10000);

                img.onload = () => {
                  clearTimeout(timeout);
                  console.log("Background image loaded successfully:", imgUrl);
                  resolve();
                };

                img.onerror = () => {
                  clearTimeout(timeout);
                  console.error("Failed to load background image:", imgUrl);
                  resolve();
                };

                img.src = imgUrl;
              })
            );
          }
        }
      });
    });

    await Promise.all(promises);

    // Additional delay to ensure everything is rendered and processed
    return new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const generateBatchStudentIdPdf = async (
    students: StudentResponse[],
    frontElements: HTMLElement[],
    backElements: HTMLElement[],
    onProgress?: (current: number, total: number) => void
  ): Promise<string> => {
    isGenerating.value = true;

    try {
      // Wait for all images to load
      await waitForImages([...frontElements, ...backElements]);

      // Create PDF with A4 landscape for better fit
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Card dimensions - smaller to fit 4 pairs (8 cards) per page
      const cardWidth = 63.5; // mm
      const cardHeight = 98; // mm - maintains 2:3 aspect ratio

      // Layout calculations for A4 landscape (297x210mm)
      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm

      // Spacing calculations for landscape layout (4x2 grid)
      const horizontalMargin = (pageWidth - 4 * cardWidth) / 5; // Space between 4 columns
      const topMargin = 10; // Fixed top margin
      const rowSpacing = 0.5; // Minimal spacing between front and back rows (~2px)

      // Card positions - 2 rows of 4 cards each with minimal spacing
      const frontRowY = topMargin;
      const backRowY = frontRowY + cardHeight + rowSpacing; // Minimal gap between rows

      const positions = [
        // Row 1 - Front cards (4 students)
        { x: horizontalMargin, y: frontRowY },
        { x: horizontalMargin + cardWidth + horizontalMargin, y: frontRowY },
        { x: horizontalMargin + 2 * (cardWidth + horizontalMargin), y: frontRowY },
        { x: horizontalMargin + 3 * (cardWidth + horizontalMargin), y: frontRowY },
        // Row 2 - Back cards (4 students) - very close to front cards
        { x: horizontalMargin, y: backRowY },
        { x: horizontalMargin + cardWidth + horizontalMargin, y: backRowY },
        { x: horizontalMargin + 2 * (cardWidth + horizontalMargin), y: backRowY },
        { x: horizontalMargin + 3 * (cardWidth + horizontalMargin), y: backRowY },
      ];

      let currentStudentIndex = 0;

      // Process students in batches of 4 (4 pairs per page)
      for (let batch = 0; batch < Math.ceil(students.length / 4); batch++) {
        const batchStudents = students.slice(batch * 4, (batch + 1) * 4);
        const batchFronts = frontElements.slice(batch * 4, (batch + 1) * 4);
        const batchBacks = backElements.slice(batch * 4, (batch + 1) * 4);

        // Add new page if not the first batch
        if (batch > 0) {
          pdf.addPage();
        }

        // Generate canvases for this batch
        const frontCanvases = await Promise.all(
          batchFronts.map((element) =>
            html2canvas(element, {
              scale: 3,
              useCORS: true,
              allowTaint: false, // Allow external images
              backgroundColor: "#ffffff",
              logging: true,
              imageTimeout: 15000,
              width: 324,
              height: 484,
            })
          )
        );

        const backCanvases = await Promise.all(
          batchBacks.map((element) =>
            html2canvas(element, {
              scale: 3,
              useCORS: true,
              allowTaint: false, // Allow external images
              backgroundColor: "#ffffff",
              logging: true,
              imageTimeout: 15000,
              width: 324,
              height: 484,
            })
          )
        );

        // Add front cards (top row - 4 cards)
        frontCanvases.forEach((canvas, index) => {
          if (index < 4 && positions[index]) {
            const frontImgData = canvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(frontImgData, "JPEG", positions[index].x, positions[index].y, cardWidth, cardHeight);

            // Add student name below front card
            // if (batchStudents[index]) {
            //   pdf.setFontSize(6);
            //   pdf.setFont('helvetica', 'normal');
            //   const studentName = `${batchStudents[index].firstName} ${batchStudents[index].lastName}`;
            //   pdf.text(studentName, positions[index].x + cardWidth / 2, positions[index].y - 2, { align: 'center' });
            // }
          }
        });

        // Add back cards (bottom row - 4 cards)
        backCanvases.forEach((canvas, index) => {
          if (index < 4 && positions[index + 4]) {
            const backImgData = canvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(backImgData, "JPEG", positions[index + 4].x, positions[index + 4].y, cardWidth, cardHeight);
          }
        });

        // Section divider and labels removed for cleaner layout

        currentStudentIndex += batchStudents.length;

        // Report progress
        if (onProgress) {
          onProgress(currentStudentIndex, students.length);
        }
      }

      // Add footer with generation info
      // const totalPages = Math.ceil(students.length / 4);
      // for (let page = 1; page <= totalPages; page++) {
      //   if (page > 1) {
      //     pdf.setPage(page);
      //   }
      //   const timestamp = new Date().toLocaleString();
      //   pdf.setFontSize(6);
      //   pdf.setFont("helvetica", "normal");
      //   pdf.text(
      //     `Generated: ${timestamp} | Total Students: ${students.length} | Page ${page} of ${totalPages}`,
      //     pageWidth / 2,
      //     pageHeight - 5,
      //     { align: "center" }
      //   );
      // }

      // Get PDF as data URL
      const pdfDataUri = pdf.output("datauristring");
      pdfDataUrl.value = pdfDataUri;

      return pdfDataUri;
    } catch (error) {
      console.error("Error generating batch PDF:", error);
      throw new Error("Failed to generate batch PDF");
    } finally {
      isGenerating.value = false;
    }
  };

  return {
    isGenerating,
    pdfDataUrl,
    generateStudentIdPdf,
    generateBatchStudentIdPdf,
    downloadPdf,
    printPdf,
  };
}
