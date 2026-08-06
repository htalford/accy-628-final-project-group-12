import { jsPDF } from "jspdf";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/resumes", { recursive: true });

const doc = new jsPDF({ unit: "pt", format: "letter" });
const margin = 54;
const pageWidth = doc.internal.pageSize.getWidth();
const maxWidth = pageWidth - margin * 2;
let y = margin;

function ensureSpace(h = 14) {
  if (y + h > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    y = margin;
  }
}

function heading(text) {
  ensureSpace(28);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 40, 80);
  doc.text(text.toUpperCase(), margin, y);
  y += 4;
  doc.setDrawColor(15, 40, 80);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setTextColor(30, 30, 30);
}

function body(text, opts = {}) {
  const size = opts.size || 10;
  const style = opts.style || "normal";
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    ensureSpace(size + 4);
    doc.text(line, margin, y);
    y += size + 3;
  }
}

function job(title, org, dates, bullets) {
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(title, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const dw = doc.getTextWidth(dates);
  doc.text(dates, pageWidth - margin - dw, y);
  y += 13;
  doc.setFont("helvetica", "italic");
  doc.text(org, margin, y);
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const b of bullets) {
    const lines = doc.splitTextToSize(`•  ${b}`, maxWidth);
    for (const line of lines) {
      ensureSpace(13);
      doc.text(line, margin, y);
      y += 12;
    }
  }
  y += 6;
}

doc.setFont("helvetica", "bold");
doc.setFontSize(20);
doc.setTextColor(15, 40, 80);
doc.text("Chad Stefaniak", margin, y);
y += 18;
doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.setTextColor(60, 60, 60);
doc.text(
  "Oxford, Mississippi  |  chad.stefaniak@example.com  |  555-0219",
  margin,
  y,
);
y += 14;
doc.text("Reliable · Adaptable · Team-first · Calm under pressure", margin, y);
y += 8;

heading("Professional Summary");
body(
  "Versatile professional who moves easily between academic, operational, and high-stakes environments. Known for quick learning, clear communication, and staying steady when plans change. Open to temp, contract, or permanent roles where ownership and follow-through matter.",
);

heading("Professional Experience");
job(
  "Associate Professor",
  "University of Mississippi — Patterson School of Accountancy, Oxford, MS",
  "Jun 2025 – Present",
  [
    "Teach and mentor students; coordinate course materials, office hours, and academic support.",
    "Collaborate with faculty on program needs and student success initiatives.",
    "Balance deadlines, documentation, and stakeholder communication across the semester calendar.",
  ],
);
job(
  "Cryptologic / Signals Specialist (E-6)",
  "U.S. Navy — various CONUS / overseas assignments",
  "Aug 2014 – May 2021",
  [
    "Operated and maintained sensitive communications and signal-collection systems in support of mission timelines.",
    "Trained junior specialists, ran watch-standing schedules, and documented procedures for shift handoffs.",
    "Worked under strict security protocols; coordinated with multi-branch teams during exercises and deployments.",
  ],
);
job(
  "River Outfitter & Operations Lead",
  "Blackwater Drift Co., Franklin, TN",
  "Mar 2011 – Jul 2014",
  [
    "Ran daily launch schedules, guest check-in, gear staging, and end-of-day reconciliation for seasonal rafting operations.",
    "Hired and coached seasonal guides; handled weather cancellations and last-minute route changes.",
    "Kept inventory of boats, PFDs, and repair kits; dealt with vendors for parts and shuttle logistics.",
  ],
);

heading("Education");
body("Bachelor's degree — Business Administration", {
  style: "bold",
  size: 10.5,
});
body("Additional coursework in operations, communications, and workplace systems.");

heading("Traits");
body(
  "Calm under pressure · Detail-oriented without getting stuck · Hands-on learner · Clear written and verbal communicator · Dependable for early / odd hours · Comfortable with both field work and desk work · Good sense of humor on long days",
);

heading("Skills");
body(
  "Microsoft Office · Radio / communications basics · Inventory tracking · Schedule coordination · Customer service · Safety briefings · Data entry · Vendor follow-up · Team leadership · Trip / logistics planning · Basic troubleshooting · Documentation & SOPs",
);

heading("Certifications & Credentials");
body(
  "OSHA 10 · First Aid / CPR · Forklift certification · Secret clearance (inactive) · Water Safety Instructor (expired)",
);

const out = "public/resumes/Chad_Stefaniak_Resume.pdf";
writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log("Wrote", out);
