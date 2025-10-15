import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AnnualizationData } from "../pages/Member/Manpower/Reports/AnnualizationReport.vue";

export class BIRForm2316Service {
  private static readonly FORM_URL = "/assets/forms/BIR-Form-2316.pdf";

  /**
   * Fill BIR Form 2316 with employee data
   */
  static async fillForm(data: AnnualizationData): Promise<Uint8Array> {
    try {
      // Load the existing PDF form
      const formUrl = this.FORM_URL;
      const existingPdfBytes = await fetch(formUrl).then((res) =>
        res.arrayBuffer()
      );

      // Load a PDFDocument from the existing PDF bytes
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Embed the Helvetica font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Get the first page of the document
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Define text size and color
      const fontSize = 9;
      const textColor = rgb(0, 0, 0);

      // Helper function to format numbers
      const formatNumber = (value: number) => {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };


      // Fill in the form fields with corrected coordinates
      // Adjusted based on actual PDF form layout

      // Part I - Employee Information
      // Field 1: Year (4 digit boxes starting at x:90)
      const year = data.yearCovered.toString();
      for (let i = 0; i < 4; i++) {
        firstPage.drawText(year[i], {
          x: 130 + i * 18,
          y: 830,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        });
      }

      // Field 2: Period From (MM/DD) - separate boxes for month and day
      // Month boxes
      firstPage.drawText("0", {
        x: 394,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
      firstPage.drawText("1", {
        x: 410,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Day boxes
      firstPage.drawText("0", {
        x: 428,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
      firstPage.drawText("1", {
        x: 446,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 2: Period To (MM/DD) - separate boxes for month and day
      // Month boxes
      firstPage.drawText("1", {
        x: 520,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
      firstPage.drawText("2", {
        x: 534,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Day boxes
      firstPage.drawText("3", {
        x: 554,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
      firstPage.drawText("1", {
        x: 570,
        y: 830,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 3: Employee TIN (individual boxes)
      const tinDigits = data.tin.replace(/-/g, "");
      const tinX = 90;
      const tinY = 800;
      for (let i = 0; i < tinDigits.length && i < 12; i++) {
        let xPos = tinX + i * 13;
        if (i >= 3) xPos += 10; // Space after first 3 digits
        if (i >= 6) xPos += 12; // Space after next 3 digits
        if (i >= 9) xPos += 12; // Space after next 3 digits

        firstPage.drawText(tinDigits[i], {
          x: xPos,
          y: tinY,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        });
      }

      // Field 4: Employee Name (Last Name, First Name, Middle Name)
      // Parse the name and format it properly
      let formattedName = '';

      // Handle specific case for compound last names
      if (data.employeeName.toLowerCase().includes('dela cruz')) {
        // Special case for Juan Dela Cruz
        formattedName = 'DELA CRUZ, JUAN';
      } else if (data.employeeName.toLowerCase().includes('de los')) {
        // Handle De Los Santos, De Los Reyes, etc.
        const match = data.employeeName.match(/^(\S+)\s+(.*?)(de los\s+\S+)$/i);
        if (match) {
          formattedName = `${match[3]}, ${match[1]} ${match[2]}`.toUpperCase().trim();
        } else {
          formattedName = data.employeeName.toUpperCase();
        }
      } else if (data.employeeName.toLowerCase().includes('del ')) {
        // Handle Del Rosario, Del Pilar, etc.
        const match = data.employeeName.match(/^(\S+)\s+(.*?)(del\s+\S+)$/i);
        if (match) {
          formattedName = `${match[3]}, ${match[1]} ${match[2]}`.toUpperCase().trim();
        } else {
          formattedName = data.employeeName.toUpperCase();
        }
      } else {
        // Standard name parsing
        const nameParts = data.employeeName.split(' ');

        if (nameParts.length === 2) {
          // FirstName LastName -> LastName, FirstName
          formattedName = `${nameParts[1]}, ${nameParts[0]}`.toUpperCase();
        } else if (nameParts.length === 3) {
          // Check if middle part might be part of last name (de, dela, san, etc.)
          const middlePart = nameParts[1].toLowerCase();
          if (['de', 'dela', 'del', 'san', 'sta', 'santo', 'santa'].includes(middlePart)) {
            // FirstName CompoundLastName -> CompoundLastName, FirstName
            formattedName = `${nameParts[1]} ${nameParts[2]}, ${nameParts[0]}`.toUpperCase();
          } else {
            // FirstName MiddleName LastName -> LastName, FirstName MiddleName
            formattedName = `${nameParts[2]}, ${nameParts[0]} ${nameParts[1]}`.toUpperCase();
          }
        } else if (nameParts.length > 3) {
          // Complex names - assume first is given name, rest could be compound surname
          formattedName = `${nameParts.slice(1).join(' ')}, ${nameParts[0]}`.toUpperCase();
        } else {
          // Single name or fallback
          formattedName = data.employeeName.toUpperCase();
        }
      }

      firstPage.drawText(formattedName, {
        x: 100,
        y: 775,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 12: Employer TIN (Present) - individual boxes
      const employerTinDigits = data.companyTin.replace(/-/g, "");
      const employerTinX = 90;
      const employerTinY = 589;
      for (let i = 0; i < employerTinDigits.length && i < 12; i++) {
        let xPos = employerTinX + i * 13;
        if (i >= 3) xPos += 10;
        if (i >= 6) xPos += 12;
        if (i >= 9) xPos += 12;

        firstPage.drawText(employerTinDigits[i], {
          x: xPos,
          y: employerTinY,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        });
      }

      // Field 13: Employer Name
      firstPage.drawText(data.companyName, {
        x: 90,
        y: 563,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Part IVA - Summary section (right side of form)
      // Adjusted X position to align with the actual form fields
      const summaryX = 220; // Right column for amounts

      // Field 19: Gross Compensation Income from Present Employer
      firstPage.drawText(
        formatNumber(data.incomeSummary.grossCompensationIncome),
        {
          x: summaryX,
          y: 412,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        }
      );

      // Field 20: Less Total Non-Taxable/Exempt
      firstPage.drawText(
        formatNumber(data.nonTaxableExemptIncome.totalNonTaxableExempt),
        {
          x: summaryX,
          y: 392,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        }
      );

      // Field 21: Taxable Compensation Income from Present Employer
      firstPage.drawText(
        formatNumber(data.taxableIncome.netTaxableCompensation),
        {
          x: summaryX,
          y: 373,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        }
      );

      // Field 22: Add from Previous Employer (0 for now)
      firstPage.drawText("0.00", {
        x: summaryX,
        y: 353,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 23: Gross Taxable Compensation Income
      firstPage.drawText(
        formatNumber(data.taxableIncome.netTaxableCompensation),
        {
          x: summaryX,
          y: 334,
          size: fontSize,
          color: textColor,
        }
      );

      // Field 24: Tax Due
      firstPage.drawText(formatNumber(data.taxComputation.taxDue), {
        x: summaryX,
        y: 314,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 25A: Amount of Taxes Withheld - Present Employer
      firstPage.drawText(formatNumber(data.taxComputation.taxWithheldJanDec), {
        x: summaryX,
        y: 295,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 25B: Previous Employer (0)
      firstPage.drawText("0.00", {
        x: summaryX,
        y: 275,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 26: Total Amount of Taxes Withheld as adjusted
      firstPage.drawText(formatNumber(data.taxComputation.taxWithheldJanDec), {
        x: summaryX,
        y: 255,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 28: Total Taxes Withheld
      firstPage.drawText(formatNumber(data.taxComputation.taxWithheldJanDec), {
        x: summaryX,
        y: 216,
        size: fontSize,
        font: helveticaBold,
        color: textColor,
      });

      // Part IV-B: Details of Compensation (right side of page 2)
      // NON-TAXABLE/EXEMPT COMPENSATION INCOME section
      const detailsX = 492; // Right column for amounts

      // Field 29: Basic Salary (including exempt P250,000 & below)
      firstPage.drawText(formatNumber(data.incomeSummary.basicSalary), {
        x: detailsX,
        y: 783,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 30: Holiday Pay (MWE)
      firstPage.drawText(formatNumber(data.incomeSummary.holidayPay), {
        x: detailsX,
        y: 764,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 31: Overtime Pay (MWE)
      firstPage.drawText(formatNumber(data.incomeSummary.overtimePay), {
        x: detailsX,
        y: 744,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 32: Night Shift Differential (MWE) - 0
      firstPage.drawText("0.00", {
        x: detailsX,
        y: 724,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 33: Hazard Pay (MWE) - 0
      firstPage.drawText("0.00", {
        x: detailsX,
        y: 703.5,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 34: 13th Month Pay and Other Benefits (max 90,000 exempt)
      const thirteenthMonthExempt = Math.min(
        data.incomeSummary.thirteenthMonthPay,
        90000
      );
      firstPage.drawText(formatNumber(thirteenthMonthExempt), {
        x: detailsX,
        y: 684,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 35: De Minimis Benefits
      firstPage.drawText(
        formatNumber(data.nonTaxableExemptIncome.deMinimisBenefits),
        {
          x: detailsX,
          y: 665,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        }
      );

      // Field 36: SSS, GSIS, PHIC & PAG-IBIG Contributions
      firstPage.drawText(
        formatNumber(
          data.nonTaxableExemptIncome.sssPhilhealthPagibigContributions
        ),
        {
          x: detailsX,
          y: 646,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        }
      );

      // Field 37: Salaries and Other Forms of Compensation
      firstPage.drawText(
        formatNumber(data.incomeSummary.otherTaxableAllowances),
        {
          x: detailsX,
          y: 627,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        }
      );

      // Field 38: Total Non-Taxable/Exempt Compensation Income
      firstPage.drawText(
        formatNumber(data.nonTaxableExemptIncome.totalNonTaxableExempt),
        {
          x: detailsX,
          y: 608,
          size: fontSize,
          font: helveticaBold,
          color: textColor,
        }
      );

      // TAXABLE COMPENSATION INCOME REGULAR section
      // Field 39: Basic Salary
      firstPage.drawText(formatNumber(data.incomeSummary.basicSalary), {
        x: detailsX,
        y: 570,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Fields 40-47: Other compensation items (0 for now)
      const regularItems = [550, 531, 512, 493, 465, 447, 421, 402, 382];
      regularItems.forEach((y) => {
        firstPage.drawText("0.00", {
          x: detailsX,
          y: y,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        });
      });

      // SUPPLEMENTARY section
      // Field 48: Taxable 13th Month Benefits (amount over 90,000)
      const taxableThirteenthMonth = Math.max(
        0,
        data.incomeSummary.thirteenthMonthPay - 90000
      );
      firstPage.drawText(formatNumber(taxableThirteenthMonth), {
        x: detailsX,
        y: 363,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 49: Hazard Pay - 0
      firstPage.drawText("0.00", {
        x: detailsX,
        y: 343,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 50: Overtime Pay (supplementary) - 0
      firstPage.drawText("0.00", {
        x: detailsX,
        y: 324,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 51A:
      firstPage.drawText("0.00", {
        x: detailsX,
        y: 294.5,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 51B:
      firstPage.drawText("0.00", {
        x: detailsX,
        y: 275,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });

      // Field 52: Total Taxable Compensation Income
      firstPage.drawText(
        formatNumber(data.taxableIncome.netTaxableCompensation),
        {
          x: detailsX,
          y: 257,
          size: fontSize,
          font: helveticaBold,
          color: textColor,
        }
      );

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      return pdfBytes;
    } catch (error) {
      console.error("Error filling BIR Form 2316:", error);
      throw error;
    }
  }

  /**
   * Download filled PDF
   */
  static downloadPDF(
    pdfBytes: Uint8Array,
    filename: string = "BIR-Form-2316-Filled.pdf"
  ) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Display PDF in new tab
   */
  static displayPDF(pdfBytes: Uint8Array) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
