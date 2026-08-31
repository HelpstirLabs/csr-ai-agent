import { jsPDF } from "jspdf";

export const generateProposalPdf = (projectRequest) => {
  const proposal = projectRequest?.proposal;

  if (!proposal) {
    console.error("Proposal content is missing:", projectRequest);
    return;
  }

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;

  let y = margin;

  const addPageIfNeeded = (height = 10) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addText = (
    text,
    {
      fontSize = 10,
      fontStyle = "normal",
      lineHeight = 5,
      spacingAfter = 3,
    } = {}
  ) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, usableWidth);

    lines.forEach((line) => {
      addPageIfNeeded(lineHeight);

      doc.text(line, margin, y);
      y += lineHeight;
    });

    y += spacingAfter;
  };

  // =========================
  // HEADER
  // =========================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Project Concept Note", margin, y);

  y += 10;

  // =========================
  // PROJECT DETAILS
  // =========================

  addText(`Geography: ${projectRequest.geography || "-"}`, {
    fontSize: 9,
    spacingAfter: 1,
  });

  addText(`Beneficiary: ${projectRequest.beneficiary || "-"}`, {
    fontSize: 9,
    spacingAfter: 1,
  });

  addText(`Budget: ${projectRequest.budget || "-"}`, {
    fontSize: 9,
    spacingAfter: 1,
  });

  addText(`Area: ${projectRequest.area || "-"}`, {
    fontSize: 9,
    spacingAfter: 1,
  });

  addText(`Scale: ${projectRequest.scale || "-"}`, {
    fontSize: 9,
    spacingAfter: 6,
  });

  // =========================
  // PROPOSAL
  // =========================

  const sections = proposal
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/);

  const headingPatterns = [
    "PROJECT TITLE",
    "EXECUTIVE SUMMARY",
    "PROBLEM STATEMENT",
    "PROJECT OBJECTIVES",
    "TARGET BENEFICIARIES",
    "PROJECT APPROACH",
    "EXPECTED OUTCOMES",
    "IMPLEMENTATION TIMELINE",
    "ESTIMATED BUDGET SUMMARY",
    "CONCLUSION",
  ];

  sections.forEach((section) => {
    const text = section.trim();

    if (!text) return;

    const lines = text.split("\n");
    const firstLine = lines[0].trim();

    // =========================
    // SECTION HEADING
    // =========================

    if (headingPatterns.includes(firstLine)) {
      addPageIfNeeded(15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);

      doc.text(firstLine, margin, y);

      y += 7;

      const remainingText = lines
        .slice(1)
        .join("\n")
        .trim();

      if (remainingText) {
        addText(remainingText, {
          fontSize: 10,
          lineHeight: 5,
          spacingAfter: 5,
        });
      }

      return;
    }

    // =========================
    // NORMAL CONTENT
    // =========================

    addText(text, {
      fontSize: 10,
      lineHeight: 5,
      spacingAfter: 5,
    });
  });

  // =========================
  // PAGE NUMBERS
  // =========================

  const totalPages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      `Project Concept Note • Page ${page} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      {
        align: "center",
      }
    );
  }

  // =========================
  // FILE NAME
  // =========================

  const titleMatch = proposal.match(
    /PROJECT TITLE\s*([\s\S]*?)(?=\n\n|EXECUTIVE SUMMARY)/
  );

  const title =
    titleMatch?.[1]
      ?.trim()
      ?.replace(/[^a-zA-Z0-9]+/g, "-")
      ?.replace(/^-|-$/g, "") ||
    "Project-Concept-Note";

  doc.save(`${title}.pdf`);
};