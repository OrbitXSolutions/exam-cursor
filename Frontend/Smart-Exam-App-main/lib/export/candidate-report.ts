/**
 * Candidate Result Report — Excel & PDF export
 * Excel: 3 sheets — Summary, Questions (EN), Questions (AR)
 *        Sub-row per selected option for MCQ
 * PDF:   Landscape A4, styled header + info cards + rich questions table
 *        Candidate's selected options shown with ✓/✗ per option
 */

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { GradingSessionDetail, GradedAnswerItem } from "@/lib/api/grading";

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

function sanitize(name: string, max = 30): string {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s_-]/g, "_")
    .substring(0, max)
    .trim();
}

function buildFilename(s: GradingSessionDetail, ext: string): string {
  return `${sanitize(s.candidateName)}_${sanitize(s.examTitleEn || s.examTitleAr || "exam")}_Result.${ext}`;
}

function calcPct(session: GradingSessionDetail): string {
  return session.maxPossibleScore > 0
    ? (((session.totalScore ?? 0) / session.maxPossibleScore) * 100).toFixed(1)
    : "0";
}

function qBody(ans: GradedAnswerItem, lang: "en" | "ar"): string {
  return (
    (lang === "ar" ? ans.questionBodyAr : ans.questionBodyEn) ||
    ans.questionBodyEn ||
    ans.questionBodyAr ||
    ""
  );
}

function correctAnswerText(ans: GradedAnswerItem, lang: "en" | "ar"): string {
  if (lang === "ar" && ans.modelAnswerAr) return ans.modelAnswerAr;
  if (ans.modelAnswerEn) return ans.modelAnswerEn;
  if (ans.selectedOptions) {
    const correct = ans.selectedOptions.filter((o) => o.isCorrect);
    if (correct.length > 0)
      return correct
        .map((o) =>
          lang === "ar" ? o.textAr || o.textEn : o.textEn || o.textAr,
        )
        .join(", ");
  }
  return "—";
}

// ─── Excel Sub-row Builder ────────────────────────────────────────────────────
/**
 * Columns:
 *  0 #  | 1 Question | 2 Type | 3 Q.Pts | 4 Option/Answer | 5 Correct Ans? | 6 Correct? | 7 Earned | 8 Method | 9 Comment
 */
function buildQuestionRows(
  answers: GradedAnswerItem[],
  lang: "en" | "ar",
): (string | number)[][] {
  const rows: (string | number)[][] = [];
  const noAns = lang === "ar" ? "لم تتم الإجابة" : "No answer provided";

  const method = (ans: GradedAnswerItem) =>
    ans.isManuallyGraded
      ? lang === "ar"
        ? "يدوي"
        : "Manual"
      : lang === "ar"
        ? "تلقائي"
        : "Auto";

  const correctMark = (isC: boolean) =>
    isC
      ? lang === "ar"
        ? "✓ صحيح"
        : "✓ Correct"
      : lang === "ar"
        ? "✗ خاطئ"
        : "✗ Wrong";

  answers.forEach((ans, i) => {
    const q = qBody(ans, lang);
    const correct = correctAnswerText(ans, lang);
    const num = i + 1;

    if (ans.selectedOptions && ans.selectedOptions.length > 0) {
      // MCQ — one sub-row per selected option
      ans.selectedOptions.forEach((opt, idx) => {
        const optTxt =
          (lang === "ar"
            ? opt.textAr || opt.textEn
            : opt.textEn || opt.textAr) || "";
        rows.push([
          idx === 0 ? num : "",
          idx === 0 ? q : "",
          idx === 0 ? ans.questionTypeName : "",
          idx === 0 ? ans.maxPoints : "",
          (lang === "ar" ? "الخيار: " : "Option: ") + optTxt,
          correct,
          correctMark(opt.isCorrect),
          idx === 0 ? ans.score : "",
          idx === 0 ? method(ans) : "",
          idx === 0 ? ans.graderComment || "" : "",
        ]);
      });
      // Totals summary sub-row
      rows.push([
        "",
        "",
        "",
        "",
        lang === "ar" ? "── الدرجة الإجمالية للإجابة ──" : "── Answer Total ──",
        "",
        ans.isCorrect
          ? lang === "ar"
            ? "✓ صحيح"
            : "✓ Correct"
          : lang === "ar"
            ? "✗ خاطئ"
            : "✗ Incorrect",
        ans.score + " / " + ans.maxPoints,
        "",
        "",
      ]);
    } else if (ans.textAnswer) {
      rows.push([
        num,
        q,
        ans.questionTypeName,
        ans.maxPoints,
        ans.textAnswer,
        correct,
        correctMark(ans.isCorrect),
        ans.score + " / " + ans.maxPoints,
        method(ans),
        ans.graderComment || "",
      ]);
    } else if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
      rows.push([
        num,
        q,
        ans.questionTypeName,
        ans.maxPoints,
        `IDs: ${ans.selectedOptionIds.join(", ")}`,
        correct,
        correctMark(ans.isCorrect),
        ans.score + " / " + ans.maxPoints,
        method(ans),
        ans.graderComment || "",
      ]);
    } else {
      rows.push([
        num,
        q,
        ans.questionTypeName,
        ans.maxPoints,
        noAns,
        correct,
        lang === "ar" ? "— لا إجابة" : "— No Answer",
        ans.score + " / " + ans.maxPoints,
        method(ans),
        ans.graderComment || "",
      ]);
    }
    // Spacer between questions
    rows.push(["", "", "", "", "", "", "", "", "", ""]);
  });
  return rows;
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export async function exportCandidateReportExcel(
  session: GradingSessionDetail,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Smart Exam System";
  wb.created = new Date();

  const percentage = calcPct(session);
  const pctNum = parseFloat(percentage);
  const passed =
    session.isPassed === true
      ? "PASSED ✓"
      : session.isPassed === false
        ? "FAILED ✗"
        : "—";

  // ── Colors (ARGB hex) ─────────────────────────────────────────────────────
  const C = {
    blue: "FF1E40AF",
    blueMid: "FF3B82F6",
    white: "FFFFFFFF",
    pass: "FF16A34A",
    fail: "FFDC2626",
    surface: "FFF8FAFC",
    border: "FFCBD5E1",
    muted: "FF64748B",
    text: "FF0F172A",
  } as const;

  const thin = (argb = C.border) => ({
    style: "thin" as const,
    color: { argb },
  });
  const allBorders = () => ({
    top: thin(),
    bottom: thin(),
    left: thin(),
    right: thin(),
  });

  // Ensure logo is cached
  await loadLogoImage();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const wsSummary = wb.addWorksheet("Summary");
  wsSummary.columns = [{ width: 28 }, { width: 55 }];

  let nextRow = 1;

  // Logo block
  if (_logoPngB64) {
    const imgId = wb.addImage({ base64: _logoPngB64, extension: "png" });
    wsSummary.addImage(imgId, {
      tl: { col: 0, row: 0 } as { col: number; row: number },
      ext: { width: 160, height: 55 },
    });
    for (let i = 1; i <= 4; i++) wsSummary.getRow(i).height = 14;
    wsSummary.getRow(5).height = 6;
    nextRow = 6;
  }

  // Title row
  wsSummary.mergeCells(`A${nextRow}:B${nextRow}`);
  const titleCell = wsSummary.getCell(`A${nextRow}`);
  titleCell.value = "CANDIDATE RESULT REPORT";
  titleCell.font = { bold: true, size: 14, color: { argb: C.white } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: C.blue },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  wsSummary.getRow(nextRow).height = 26;
  nextRow += 2;

  const addSummaryRow = (
    label: string,
    value: string | number,
    valueArgb?: string,
  ) => {
    const lCell = wsSummary.getCell(`A${nextRow}`);
    lCell.value = label;
    lCell.font = { bold: true, color: { argb: C.blue } };
    lCell.alignment = { horizontal: "left", vertical: "middle" };
    const vCell = wsSummary.getCell(`B${nextRow}`);
    vCell.value = value;
    vCell.font = valueArgb
      ? { bold: true, color: { argb: valueArgb } }
      : { color: { argb: C.text } };
    vCell.alignment = { horizontal: "left", vertical: "middle" };
    wsSummary.getRow(nextRow).height = 16;
    nextRow++;
  };

  addSummaryRow("Exam (EN):", session.examTitleEn || "—");
  addSummaryRow("Exam (AR):", session.examTitleAr || "—");
  nextRow++;
  addSummaryRow("Candidate Name:", session.candidateName);
  addSummaryRow("Candidate ID:", session.candidateId);
  addSummaryRow("Attempt ID:", session.attemptId);
  addSummaryRow("Graded At:", fmtDate(session.gradedAt));
  addSummaryRow("Grading Status:", session.statusName ?? "—");
  nextRow++;

  // Section header
  wsSummary.mergeCells(`A${nextRow}:B${nextRow}`);
  const secCell = wsSummary.getCell(`A${nextRow}`);
  secCell.value = "SCORE SUMMARY";
  secCell.font = { bold: true, size: 11, color: { argb: C.white } };
  secCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: C.blueMid },
  };
  secCell.alignment = { horizontal: "center", vertical: "middle" };
  wsSummary.getRow(nextRow).height = 20;
  nextRow += 2;

  const resultColor =
    session.isPassed === true
      ? C.pass
      : session.isPassed === false
        ? C.fail
        : C.muted;
  addSummaryRow(
    "Total Score:",
    `${session.totalScore?.toFixed(2) ?? "0"} / ${session.maxPossibleScore}`,
  );
  addSummaryRow(
    "Percentage:",
    `${percentage}%`,
    pctNum >= 50 ? C.pass : C.fail,
  );
  addSummaryRow("Pass Score:", session.passScore);
  addSummaryRow("Result:", passed, resultColor);
  addSummaryRow("Total Questions:", session.totalQuestions);
  addSummaryRow("Graded Questions:", session.gradedQuestions);
  addSummaryRow("Pending Manual Grading:", session.manualGradingRequired ?? 0);

  // ── Sheets 2 & 3: Questions ───────────────────────────────────────────────
  const COL_WIDTHS = [5, 52, 18, 13, 44, 40, 16, 18, 16, 40];

  const addQSheet = (
    name: string,
    headers: string[],
    rows: (string | number)[][],
  ) => {
    const ws = wb.addWorksheet(name);
    ws.columns = COL_WIDTHS.map((w) => ({ width: w }));
    ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // Header row
    const hRow = ws.addRow(headers);
    hRow.height = 20;
    hRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: C.white } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: C.blue },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = allBorders();
    });

    // Body rows
    rows.forEach((rowData, idx) => {
      const row = ws.addRow(rowData);
      const isAlt = idx % 2 === 1;
      row.height = 15;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = allBorders();
        if (isAlt) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: C.surface },
          };
        }
        const val = String(cell.value ?? "");
        if (val.startsWith("✓")) {
          cell.font = { bold: true, color: { argb: C.pass } };
        } else if (val.startsWith("✗")) {
          cell.font = { bold: true, color: { argb: C.fail } };
        }
      });
    });
  };

  const sorted = [...session.answers].sort(
    (a, b) => a.questionId - b.questionId,
  );

  addQSheet(
    "Questions (EN)",
    [
      "#",
      "Question (EN)",
      "Type",
      "Q. Max Points",
      "Option / Answer (Selected)",
      "Correct Answer",
      "Is Correct?",
      "Earned / Max Points",
      "Grading Method",
      "Grader Comment",
    ],
    buildQuestionRows(sorted, "en"),
  );
  addQSheet(
    "Questions (AR)",
    [
      "م",
      "السؤال",
      "النوع",
      "الدرجة القصوى",
      "الخيار / الإجابة المُختارة",
      "الإجابة الصحيحة",
      "صحيح؟",
      "النقاط المكتسبة / القصوى",
      "طريقة التصحيح",
      "تعليق",
    ],
    buildQuestionRows(sorted, "ar"),
  );

  // ── Download ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(session, "xlsx");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── PDF Colors ───────────────────────────────────────────────────────────────

const C_PRIMARY: [number, number, number] = [30, 64, 175];
const C_PRIMARY_LIGHT: [number, number, number] = [59, 130, 246];
const C_PASS: [number, number, number] = [22, 163, 74];
const C_FAIL: [number, number, number] = [220, 38, 38];
const C_WARN: [number, number, number] = [217, 119, 6];
const C_SURFACE: [number, number, number] = [248, 250, 252];
const C_SURFACE2: [number, number, number] = [241, 245, 249];
const C_BORDER: [number, number, number] = [203, 213, 225];
const C_MUTED: [number, number, number] = [100, 116, 139];
const C_TEXT: [number, number, number] = [15, 23, 42];
const C_WHITE: [number, number, number] = [255, 255, 255];
const C_CORRECT_BG: [number, number, number] = [240, 253, 244];
const C_WRONG_BG: [number, number, number] = [254, 242, 242];

// ─── PDF Helper — stat box ────────────────────────────────────────────────────

function statBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: [number, number, number] = C_PRIMARY,
  font = "helvetica",
  labelSize = 7.5,
  valueSize = 15,
): void {
  // Card background + border
  doc.setFillColor(...C_WHITE);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "FD");
  // Thick accent bar at top
  doc.setFillColor(...accent);
  doc.roundedRect(x, y, w, 4, 1.5, 1.5, "F");
  doc.rect(x, y + 2, w, 2, "F"); // square bottom of top-bar
  // Label
  doc.setFontSize(labelSize);
  doc.setFont(font, "normal");
  doc.setTextColor(...C_MUTED);
  doc.text(label, x + w / 2, y + 11, { align: "center" });
  // Value
  doc.setFontSize(valueSize);
  doc.setFont(font, font === "helvetica" ? "bold" : "normal");
  doc.setTextColor(...accent);
  doc.text(value, x + w / 2, y + 20, { align: "center" });
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportCandidateReportPdf(session: GradingSessionDetail): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = 297;
  const PH = 210;
  const M = 11;

  const percentage = calcPct(session);
  const pctNum = parseFloat(percentage);
  const resultColor = session.isPassed ? C_PASS : C_FAIL;
  const examTitle = session.examTitleEn || session.examTitleAr || "";

  // ── Header banner ─────────────────────────────────────────────────────────
  doc.setFillColor(...C_PRIMARY);
  doc.rect(0, 0, PW, 26, "F");
  doc.setFillColor(...C_PRIMARY_LIGHT);
  doc.rect(0, 20, PW, 6, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 210, 255);
  doc.text("Smart Exam System", PW - M, 5, { align: "right" });

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("Candidate Result Report", PW / 2, 13, { align: "center" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  if (examTitle) {
    doc.text(examTitle, PW / 2, 23.5, { align: "center", maxWidth: 240 });
  }

  let y = 32;

  // ── Candidate info + Score cards ──────────────────────────────────────────
  const LEFT_W = 108;
  const RIGHT_X = M + LEFT_W + 5;
  const RIGHT_W = PW - M * 2 - LEFT_W - 5;
  const ROW_H = 68; // tall enough for badge in header + 2 rows of stat boxes

  // ── Left card — candidate information ────────────────────────────────────
  doc.setFillColor(...C_WHITE);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(M, y, LEFT_W, ROW_H, 3, 3, "FD");
  // Header bar (10mm)
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(M, y, LEFT_W, 10, 3, 3, "F");
  doc.rect(M, y + 7, LEFT_W, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("CANDIDATE INFORMATION", M + LEFT_W / 2, y + 6.5, {
    align: "center",
  });

  const infoFields: [string, string][] = [
    ["Name:", session.candidateName],
    ["Candidate ID:", session.candidateId],
    ["Attempt ID:", String(session.attemptId)],
    ["Graded At:", fmtDate(session.gradedAt)],
    ["Grading Status:", session.statusName ?? "—"],
  ];
  infoFields.forEach(([label, val], i) => {
    const ly = y + 15 + i * 10;
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_MUTED);
    doc.text(label, M + 5, ly);
    // Value
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_TEXT);
    doc.text(val, M + 5, ly + 4.5, { maxWidth: LEFT_W - 10 });
  });

  // ── Right card — score summary ────────────────────────────────────────────
  doc.setFillColor(...C_WHITE);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(RIGHT_X, y, RIGHT_W, ROW_H, 3, 3, "FD");

  // Header bar (10mm) with "SCORE SUMMARY" left + PASSED/FAILED badge right
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(RIGHT_X, y, RIGHT_W, 10, 3, 3, "F");
  doc.rect(RIGHT_X, y + 7, RIGHT_W, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("SCORE SUMMARY", RIGHT_X + 5, y + 6.5);

  // PASSED/FAILED badge — right-aligned inside header
  const BADGE_W = 42;
  const BADGE_X = RIGHT_X + RIGHT_W - BADGE_W - 3;
  doc.setFillColor(...resultColor);
  doc.roundedRect(BADGE_X, y + 1, BADGE_W, 8, 2, 2, "F");
  doc.setTextColor(...C_WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    session.isPassed === true
      ? "PASSED"
      : session.isPassed === false
        ? "FAILED"
        : "PENDING",
    BADGE_X + BADGE_W / 2,
    y + 6.3,
    { align: "center" },
  );

  // 4 stat boxes in 2×2 grid below header
  // Layout math: header=10mm, gap=3, box row1 starts at y+13
  //   boxH=24, gap=3 → row2 at y+40, ends at y+64, 4mm bottom padding → ROW_H=68 ✓
  const boxPad = 3;
  const boxW = (RIGHT_W - boxPad * 3) / 2;
  const boxH = 24;
  const bY1 = y + 13;
  const bY2 = y + 13 + boxH + 3;

  statBox(
    doc,
    RIGHT_X + boxPad,
    bY1,
    boxW,
    boxH,
    "TOTAL SCORE",
    `${session.totalScore?.toFixed(2) ?? "0"} / ${session.maxPossibleScore}`,
    C_PRIMARY,
  );
  statBox(
    doc,
    RIGHT_X + boxPad * 2 + boxW,
    bY1,
    boxW,
    boxH,
    "PERCENTAGE",
    `${percentage}%`,
    pctNum >= 50 ? C_PASS : C_FAIL,
  );
  statBox(
    doc,
    RIGHT_X + boxPad,
    bY2,
    boxW,
    boxH,
    "PASS SCORE",
    String(session.passScore),
    C_WARN,
  );
  statBox(
    doc,
    RIGHT_X + boxPad * 2 + boxW,
    bY2,
    boxW,
    boxH,
    "QUESTIONS",
    `${session.gradedQuestions} / ${session.totalQuestions}`,
    C_MUTED,
  );

  y += ROW_H + 5;

  // ── Progress bar ──────────────────────────────────────────────────────────
  const BAR_W = PW - M * 2;
  const fillW = Math.max(2, Math.min(BAR_W * (pctNum / 100), BAR_W));

  doc.setFillColor(...C_SURFACE2);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(M, y, BAR_W, 5, 2.5, 2.5, "FD");
  doc.setFillColor(...(pctNum >= 50 ? C_PASS : C_FAIL));
  doc.roundedRect(M, y, fillW, 5, 2.5, 2.5, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_MUTED);
  doc.text(
    `${percentage}% of total marks achieved  ·  Pass required: ${session.passScore} pts`,
    PW / 2,
    y + 9.5,
    { align: "center" },
  );

  y += 14;

  // ── Section header ────────────────────────────────────────────────────────
  doc.setFillColor(...C_SURFACE2);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(M, y, BAR_W, 7, 2, 2, "FD");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_PRIMARY);
  doc.text("Question & Answer Details", M + 5, y + 5);
  const badge = `${session.totalQuestions} Questions`;
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(PW - M - 40, y + 1, 40, 5, 1.5, 1.5, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...C_WHITE);
  doc.text(badge, PW - M - 20, y + 4.7, { align: "center" });

  y += 9;

  // ── Questions table ───────────────────────────────────────────────────────
  const sorted = [...session.answers].sort(
    (a, b) => a.questionId - b.questionId,
  );

  const tableBody = sorted.map((ans, i) => {
    const question = (ans.questionBodyEn || ans.questionBodyAr || "").substring(
      0,
      250,
    );

    // Candidate answer — each selected option on its own line with ✓/✗
    let candidateAns = "";
    if (ans.textAnswer) {
      candidateAns = ans.textAnswer.substring(0, 200);
    } else if (ans.selectedOptions && ans.selectedOptions.length > 0) {
      candidateAns = ans.selectedOptions
        .map(
          (o) =>
            `${o.isCorrect ? "[+]" : "[-]"} ${(o.textEn || o.textAr || "").substring(0, 65)}`,
        )
        .join("\n");
    } else if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
      candidateAns = `IDs: ${ans.selectedOptionIds.join(", ")}`;
    } else {
      candidateAns = "No answer";
    }

    const correctAns = correctAnswerText(ans, "en").substring(0, 180);
    const score = `${ans.score} / ${ans.maxPoints}`;
    const result = ans.isCorrect ? "Correct" : "Incorrect";
    const method = ans.isManuallyGraded ? "Manual" : "Auto";

    return [
      String(i + 1),
      question,
      ans.questionTypeName,
      candidateAns,
      correctAns,
      score,
      result,
      method,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    tableWidth: BAR_W,
    head: [
      [
        "#",
        "Question",
        "Type",
        "Candidate's Answer  ([+] Correct  [-] Wrong)",
        "Correct Answer",
        "Score",
        "Result",
        "Method",
      ],
    ],
    body: tableBody,
    headStyles: {
      fillColor: C_PRIMARY,
      textColor: C_WHITE,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: C_TEXT,
      valign: "top",
      minCellHeight: 9,
    },
    alternateRowStyles: { fillColor: C_SURFACE },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 63 },
      2: { cellWidth: 20 },
      3: { cellWidth: 76 },
      4: { cellWidth: 50 },
      5: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      6: { cellWidth: 22, halign: "center" },
      7: { cellWidth: 16, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      // Result column
      if (data.column.index === 6) {
        const txt = String(data.cell.raw ?? "");
        if (txt === "Correct") {
          data.cell.styles.textColor = C_PASS;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = C_CORRECT_BG;
        } else if (txt === "Incorrect") {
          data.cell.styles.textColor = C_FAIL;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = C_WRONG_BG;
        }
      }
      // Score column — color by value
      if (data.column.index === 5) {
        const parts = String(data.cell.raw ?? "")
          .split("/")
          .map((p) => parseFloat(p.trim()));
        if (
          parts.length === 2 &&
          !isNaN(parts[0]) &&
          !isNaN(parts[1]) &&
          parts[1] > 0
        ) {
          if (parts[0] === parts[1]) data.cell.styles.textColor = C_PASS;
          else if (parts[0] === 0) data.cell.styles.textColor = C_FAIL;
          else data.cell.styles.textColor = C_WARN;
        }
      }
    },
  });

  // ── Footer on each page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  const generatedOn = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...C_SURFACE2);
    doc.rect(0, PH - 10, PW, 10, "F");
    doc.setDrawColor(...C_BORDER);
    doc.line(0, PH - 10, PW, PH - 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_MUTED);
    doc.text(`Generated: ${generatedOn}`, M, PH - 4.5);
    doc.text(
      `${session.candidateName}  ·  Attempt #${session.attemptId}  ·  ${session.examTitleEn || session.examTitleAr}`,
      PW / 2,
      PH - 4.5,
      { align: "center" },
    );
    doc.text(`Page ${p} of ${totalPages}`, PW - M, PH - 4.5, {
      align: "right",
    });
  }

  doc.save(buildFilename(session, "pdf"));
}

// ─── Arabic translation helpers ──────────────────────────────────────────────

function translateStatus(status: string | null | undefined): string {
  const map: Record<string, string> = {
    AutoGraded: "تصحيح تلقائي",
    ManualGraded: "تصحيح يدوي",
    PendingManual: "في انتظار التصحيح",
    Graded: "تم التصحيح",
    Pending: "معلق",
    Passed: "ناجح",
    Failed: "راسب",
  };
  return (status && map[status]) ?? status ?? "—";
}

function translateQuestionType(type: string | null | undefined): string {
  const map: Record<string, string> = {
    MCQ_Single: "اختيار واحد",
    MCQ_Multi: "اختيار متعدد",
    TrueFalse: "صح / خطأ",
    Essay: "مقالي",
    ShortAnswer: "إجابة قصيرة",
    Numeric: "رقمي",
    Matching: "مطابقة",
    Ordering: "ترتيب",
    Fill_Blank: "ملء الفراغ",
    FillBlank: "ملء الفراغ",
  };
  return (type && map[type]) ?? type ?? "—";
}

function fmtDateAr(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

// ─── Arabic font lazy loader ──────────────────────────────────────────────────

let _amiriRegB64: string | null = null;
let _amiriBoldB64: string | null = null;

async function ttfToBase64(url: string): Promise<string> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK)
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

async function loadAmiriFont(doc: jsPDF): Promise<boolean> {
  const BASE = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/";
  try {
    if (!_amiriRegB64)
      _amiriRegB64 = await ttfToBase64(`${BASE}Amiri-Regular.ttf`);
    doc.addFileToVFS("Amiri-Regular.ttf", _amiriRegB64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");

    if (!_amiriBoldB64) {
      try {
        _amiriBoldB64 = await ttfToBase64(`${BASE}Amiri-Bold.ttf`);
      } catch {
        /* bold not critical */
      }
    }
    if (_amiriBoldB64) {
      doc.addFileToVFS("Amiri-Bold.ttf", _amiriBoldB64);
      doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Logo image lazy loader ───────────────────────────────────────────────────

let _logoPngB64: string | null = null;

async function loadLogoImage(): Promise<string | null> {
  if (_logoPngB64) return _logoPngB64;
  try {
    const res = await fetch("/logo.png", { cache: "force-cache" });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK)
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    _logoPngB64 = btoa(binary);
    return _logoPngB64;
  } catch {
    return null;
  }
}

// ─── Arabic PDF Export (RTL layout) ──────────────────────────────────────────

export async function exportCandidateReportPdfAr(
  session: GradingSessionDetail,
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = 297;
  const PH = 210;
  const M = 11;

  const hasAr = await loadAmiriFont(doc);
  const AF = hasAr ? "Amiri" : "helvetica";

  const percentage = calcPct(session);
  const pctNum = parseFloat(percentage);
  const resultColor = session.isPassed ? C_PASS : C_FAIL;
  const examTitle = session.examTitleAr || session.examTitleEn || "";

  // ── Header banner ────────────────────────────────────────────────────────────────────
  const logoPngB64 = await loadLogoImage();
  doc.setFillColor(...C_PRIMARY);
  doc.rect(0, 0, PW, 30, "F");
  doc.setFillColor(...C_PRIMARY_LIGHT);
  doc.rect(0, 22, PW, 8, "F");

  // Logo — top-left corner of banner
  if (logoPngB64) {
    const LOGO_H = 14;
    const LOGO_W = LOGO_H * 3; // ~3:1 aspect ratio
    doc.addImage(
      "data:image/png;base64," + logoPngB64,
      "PNG",
      M,
      3,
      LOGO_W,
      LOGO_H,
    );
  }

  doc.setFontSize(10);
  doc.setFont(AF, "normal");
  doc.setTextColor(180, 210, 255);
  doc.text("نظام الاختبار الذكي", PW - M, 5, { align: "right" });

  doc.setFontSize(18);
  doc.setFont(AF, "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("تقرير نتيجة المرشح", PW / 2, 13, { align: "center" });

  // Exam title in the light strip
  doc.setFontSize(11);
  doc.setFont(AF, "bold");
  doc.setTextColor(...C_WHITE);
  if (examTitle) {
    doc.text(examTitle, PW / 2, 27, { align: "center", maxWidth: 260 });
  }

  let y = 36;

  // ── RTL layout: Score Summary on LEFT, Candidate Info on RIGHT ───────────────
  const SCORE_W = PW - M * 2 - 108 - 5;
  const SCORE_X = M;
  const INFO_X = M + SCORE_W + 5;
  const INFO_W = 108;
  const ROW_H = 76;

  // ── Score Summary card (LEFT in RTL) ──────────────────────────────────────────
  doc.setFillColor(...C_WHITE);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(SCORE_X, y, SCORE_W, ROW_H, 3, 3, "FD");
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(SCORE_X, y, SCORE_W, 10, 3, 3, "F");
  doc.rect(SCORE_X, y + 7, SCORE_W, 3, "F");
  doc.setFontSize(12);
  doc.setFont(AF, "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("ملخص الدرجات", SCORE_X + SCORE_W - 5, y + 6.5, { align: "right" });

  // PASSED/FAILED badge — left-aligned (RTL mirror)
  const BADGE_W = 42;
  doc.setFillColor(...resultColor);
  doc.roundedRect(SCORE_X + 3, y + 1, BADGE_W, 8, 2, 2, "F");
  doc.setTextColor(...C_WHITE);
  doc.setFontSize(12);
  doc.setFont(AF, "bold");
  doc.text(
    session.isPassed === true
      ? "ناجح"
      : session.isPassed === false
        ? "راسب"
        : "معلق",
    SCORE_X + 3 + BADGE_W / 2,
    y + 6.3,
    { align: "center" },
  );

  // 4 stat boxes 2×2
  const boxPad = 3;
  const boxW = (SCORE_W - boxPad * 3) / 2;
  const boxH = 27;
  const bY1 = y + 13;
  const bY2 = y + 13 + boxH + 3;

  statBox(
    doc,
    SCORE_X + boxPad,
    bY1,
    boxW,
    boxH,
    "إجمالي الدرجات",
    `${session.totalScore?.toFixed(2) ?? "0"} / ${session.maxPossibleScore}`,
    C_PRIMARY,
    AF,
    10,
    17,
  );
  statBox(
    doc,
    SCORE_X + boxPad * 2 + boxW,
    bY1,
    boxW,
    boxH,
    "النسبة المئوية",
    `${percentage}%`,
    pctNum >= 50 ? C_PASS : C_FAIL,
    AF,
    10,
    17,
  );
  statBox(
    doc,
    SCORE_X + boxPad,
    bY2,
    boxW,
    boxH,
    "درجة النجاح",
    String(session.passScore),
    C_WARN,
    AF,
    10,
    17,
  );
  statBox(
    doc,
    SCORE_X + boxPad * 2 + boxW,
    bY2,
    boxW,
    boxH,
    "الأسئلة",
    `${session.gradedQuestions} / ${session.totalQuestions}`,
    C_MUTED,
    AF,
    10,
    17,
  );

  // ── Candidate Info card (RIGHT in RTL) ──────────────────────────────────────────
  doc.setFillColor(...C_WHITE);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(INFO_X, y, INFO_W, ROW_H, 3, 3, "FD");
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(INFO_X, y, INFO_W, 10, 3, 3, "F");
  doc.rect(INFO_X, y + 7, INFO_W, 3, "F");
  doc.setFontSize(12);
  doc.setFont(AF, "bold");
  doc.setTextColor(...C_WHITE);
  doc.text("بيانات المرشح", INFO_X + INFO_W / 2, y + 6.5, { align: "center" });

  const arLabels: [string, string][] = [
    ["الاسم", session.candidateName],
    ["رقم المرشح", session.candidateId],
    ["رقم المحاولة", String(session.attemptId)],
    ["تاريخ التصحيح", fmtDateAr(session.gradedAt)],
    ["حالة التصحيح", translateStatus(session.statusName)],
  ];
  arLabels.forEach(([label, val], i) => {
    const ly = y + 15 + i * 11.5;
    // Label — right-aligned
    doc.setFontSize(10);
    doc.setFont(AF, "bold");
    doc.setTextColor(...C_MUTED);
    doc.text(label, INFO_X + INFO_W - 5, ly, { align: "right" });
    // Value below
    doc.setFontSize(10);
    doc.setFont(AF, "bold");
    doc.setTextColor(...C_TEXT);
    doc.text(val, INFO_X + INFO_W - 5, ly + 5.5, {
      align: "right",
      maxWidth: INFO_W - 10,
    });
  });

  y += ROW_H + 5;

  // ── Progress bar (RTL — fills from right) ───────────────────────────────────────────
  const BAR_W = PW - M * 2;
  const fillW = Math.max(2, Math.min(BAR_W * (pctNum / 100), BAR_W));

  doc.setFillColor(...C_SURFACE2);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(M, y, BAR_W, 5, 2.5, 2.5, "FD");
  doc.setFillColor(...(pctNum >= 50 ? C_PASS : C_FAIL));
  doc.roundedRect(M + BAR_W - fillW, y, fillW, 5, 2.5, 2.5, "F"); // RTL: from right

  doc.setFontSize(10);
  doc.setFont(AF, "bold");
  doc.setTextColor(...C_MUTED);
  doc.text(
    `${percentage}% من إجمالي الدرجات  ·  درجة النجاح: ${session.passScore} نقطة`,
    PW / 2,
    y + 9.5,
    { align: "center" },
  );

  y += 14;

  // ── Section header (RTL) ───────────────────────────────────────────────────────────
  doc.setFillColor(...C_SURFACE2);
  doc.setDrawColor(...C_BORDER);
  doc.roundedRect(M, y, BAR_W, 7, 2, 2, "FD");
  doc.setFontSize(12);
  doc.setFont(AF, "bold");
  doc.setTextColor(...C_PRIMARY);
  doc.text("تفاصيل الأسئلة والإجابات", PW - M - 5, y + 5, { align: "right" });
  // Badge on left (RTL mirror)
  const arBadge = `${session.totalQuestions} سؤال`;
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(M, y + 1, 38, 5, 1.5, 1.5, "F");
  doc.setFontSize(10);
  doc.setTextColor(...C_WHITE);
  doc.text(arBadge, M + 19, y + 4.7, { align: "center" });

  y += 9;

  // ── Questions table (Arabic content) ─────────────────────────────────────────────
  const sorted = [...session.answers].sort(
    (a, b) => a.questionId - b.questionId,
  );

  const tableBody = sorted.map((ans, i) => {
    const question = (ans.questionBodyAr || ans.questionBodyEn || "").substring(
      0,
      250,
    );

    let candidateAns = "";
    if (ans.textAnswer) {
      candidateAns = ans.textAnswer.substring(0, 200);
    } else if (ans.selectedOptions && ans.selectedOptions.length > 0) {
      candidateAns = ans.selectedOptions
        .map(
          (o) =>
            `${o.isCorrect ? "[+]" : "[-]"} ${(o.textAr || o.textEn || "").substring(0, 65)}`,
        )
        .join("\n");
    } else if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
      candidateAns = `IDs: ${ans.selectedOptionIds.join(", ")}`;
    } else {
      candidateAns = "لم تتم الإجابة";
    }

    const correctAns = correctAnswerText(ans, "ar").substring(0, 180);
    const score = `${ans.score} / ${ans.maxPoints}`;
    const result = ans.isCorrect ? "صحيح" : "خاطئ";
    const method = ans.isManuallyGraded ? "يدوي" : "تلقائي";

    // RTL column order — reversed so م appears on the RIGHT side
    return [
      method,
      result,
      score,
      correctAns,
      candidateAns,
      translateQuestionType(ans.questionTypeName),
      question,
      String(i + 1),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    tableWidth: BAR_W,
    head: [
      [
        // RTL order: leftmost col = التصحيح, rightmost col = م
        "التصحيح",
        "النتيجة",
        "الدرجة",
        "الإجابة الصحيحة",
        "إجابة المرشح",
        "النوع",
        "السؤال",
        "م",
      ],
    ],
    body: tableBody,
    headStyles: {
      fillColor: C_PRIMARY,
      textColor: C_WHITE,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      font: AF,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      fontStyle: "bold",
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      textColor: C_TEXT,
      valign: "middle",
      minCellHeight: 13,
      font: AF,
      halign: "center",
    },
    alternateRowStyles: { fillColor: C_SURFACE },
    columnStyles: {
      // 0=التصحيح | 1=النتيجة | 2=الدرجة | 3=الإجابة الصحيحة | 4=إجابة المرشح | 5=النوع | 6=السؤال | 7=م
      0: { cellWidth: 28, halign: "center" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 47, halign: "center" },
      4: { cellWidth: 65, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 58, halign: "center" },
      7: { cellWidth: 8, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      // col 1 = النتيجة
      if (data.column.index === 1) {
        const txt = String(data.cell.raw ?? "");
        if (txt === "صحيح") {
          data.cell.styles.textColor = C_PASS;
          data.cell.styles.fillColor = C_CORRECT_BG;
        } else if (txt === "خاطئ") {
          data.cell.styles.textColor = C_FAIL;
          data.cell.styles.fillColor = C_WRONG_BG;
        }
      }
      // col 2 = الدرجة
      if (data.column.index === 2) {
        const parts = String(data.cell.raw ?? "")
          .split("/")
          .map((p) => parseFloat(p.trim()));
        if (
          parts.length === 2 &&
          !isNaN(parts[0]) &&
          !isNaN(parts[1]) &&
          parts[1] > 0
        ) {
          if (parts[0] === parts[1]) data.cell.styles.textColor = C_PASS;
          else if (parts[0] === 0) data.cell.styles.textColor = C_FAIL;
          else data.cell.styles.textColor = C_WARN;
        }
      }
    },
  });

  // ── Footer (RTL) ─────────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  const generatedOn = new Date().toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...C_SURFACE2);
    doc.rect(0, PH - 10, PW, 10, "F");
    doc.setDrawColor(...C_BORDER);
    doc.line(0, PH - 10, PW, PH - 10);
    doc.setFontSize(8);
    doc.setFont(AF, "bold");
    doc.setTextColor(...C_MUTED);
    doc.text(`تم الإنشاء: ${generatedOn}`, PW - M, PH - 4.5, {
      align: "right",
    });
    doc.text(
      `${session.candidateName}  ·  محاولة #${session.attemptId}  ·  ${session.examTitleAr || session.examTitleEn}`,
      PW / 2,
      PH - 4.5,
      { align: "center" },
    );
    doc.text(`صفحة ${p} من ${totalPages}`, M, PH - 4.5);
  }

  doc.save(buildFilename(session, "pdf").replace(/\.pdf$/, "_AR.pdf"));
}
