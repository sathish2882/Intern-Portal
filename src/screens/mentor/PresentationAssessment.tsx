import { useState, useMemo, useCallback } from "react";
import {
  FiSave,
  FiRotateCcw,
  FiChevronDown,
  FiChevronUp,
  FiAward,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";

// ── Types ──────────────────────────────────────────
interface Criterion {
  name: string;
  desc: string;
  maxScore: number;
}

interface Category {
  name: string;
  maxScore: number;
  criteria: Criterion[];
}

interface FormData {
  date: string;
  internName: string;
  specialization: string;
  mentorName: string;
  presentationTopic: string;
  batch: string;
}

// ── Assessment Categories (105 pts total) ──────────
const CATEGORIES: Category[] = [
  {
    name: "Content & Structure",
    maxScore: 20,
    criteria: [
      { name: "Topic Understanding", desc: "Demonstrates clear grasp of the subject matter.", maxScore: 5 },
      { name: "Content Accuracy", desc: "Information presented is correct and well-researched.", maxScore: 5 },
      { name: "Logical Flow & Organization", desc: "Ideas progress in a clear, coherent sequence.", maxScore: 5 },
      { name: "Depth of Research", desc: "Evidence of thorough background research and references.", maxScore: 5 },
    ],
  },
  {
    name: "Delivery & Communication",
    maxScore: 20,
    criteria: [
      { name: "Verbal Clarity & Pace", desc: "Speaks clearly, at an appropriate speed and volume.", maxScore: 5 },
      { name: "Body Language & Eye Contact", desc: "Confident posture, gestures, and audience eye contact.", maxScore: 5 },
      { name: "Confidence & Stage Presence", desc: "Delivers with poise and commands attention.", maxScore: 5 },
      { name: "Audience Engagement", desc: "Actively involves and maintains audience interest.", maxScore: 5 },
    ],
  },
  {
    name: "Visual Design & Slides",
    maxScore: 15,
    criteria: [
      { name: "Slide Design & Aesthetics", desc: "Visually appealing, consistent, and professional layout.", maxScore: 5 },
      { name: "Use of Visuals & Data", desc: "Charts, images, and data used effectively.", maxScore: 5 },
      { name: "Readability & Formatting", desc: "Text is legible, well-spaced, and not overcrowded.", maxScore: 5 },
    ],
  },
  {
    name: "Q&A & Interaction",
    maxScore: 15,
    criteria: [
      { name: "Handling Questions", desc: "Responds to questions calmly and accurately.", maxScore: 5 },
      { name: "Critical Thinking in Response", desc: "Demonstrates analytical reasoning under questioning.", maxScore: 5 },
      { name: "Clarity of Answers", desc: "Answers are concise, relevant, and well-structured.", maxScore: 5 },
    ],
  },
  {
    name: "Time Management",
    maxScore: 15,
    criteria: [
      { name: "Adherence to Time Limit", desc: "Finishes within the allocated time slot.", maxScore: 5 },
      { name: "Pacing Throughout", desc: "Time is balanced well across all sections.", maxScore: 5 },
      { name: "Conclusion Effectiveness", desc: "Ends with a strong, memorable closing statement.", maxScore: 5 },
    ],
  },
  {
    name: "Overall Impression",
    maxScore: 20,
    criteria: [
      { name: "Creativity & Originality", desc: "Unique angle or creative elements stand out.", maxScore: 5 },
      { name: "Professionalism", desc: "Conducts the session in a professional manner.", maxScore: 5 },
      { name: "Impact & Key Takeaway", desc: "Audience walks away with a clear, memorable message.", maxScore: 5 },
      { name: "Overall Delivery Score", desc: "Holistic assessment of the entire presentation.", maxScore: 5 },
    ],
  },
];

const MAX_TOTAL = CATEGORIES.reduce((s, c) => s + c.maxScore, 0);

// ── Grade Thresholds ───────────────────────────────
const getGrade = (pct: number) => {
  if (pct >= 90) return { label: "Outstanding", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (pct >= 75) return { label: "Excellent", color: "text-blue bg-sky border-blue/20" };
  if (pct >= 60) return { label: "Good", color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (pct >= 45) return { label: "Average", color: "text-orange-600 bg-orange-50 border-orange-200" };
  return { label: "Needs Improvement", color: "text-red-600 bg-red-50 border-red-200" };
};

// ── Component ──────────────────────────────────────
const PresentationAssessment = () => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    internName: "",
    specialization: "",
    mentorName: "",
    presentationTopic: "",
    batch: "",
  });

  const [scores, setScores] = useState<number[][]>(
    CATEGORIES.map((cat) => cat.criteria.map(() => 0))
  );

  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(CATEGORIES.map((_, i) => i))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const setScore = useCallback(
    (catIdx: number, critIdx: number, value: number) => {
      setScores((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[catIdx][critIdx] = value;
        return next;
      });
      setSaved(false);
    },
    []
  );

  const categoryTotals = useMemo(
    () => scores.map((catScores) => catScores.reduce((s, v) => s + v, 0)),
    [scores]
  );

  const totalScore = useMemo(
    () => categoryTotals.reduce((s, v) => s + v, 0),
    [categoryTotals]
  );

  const totalPct = MAX_TOTAL > 0 ? Math.round((totalScore / MAX_TOTAL) * 100) : 0;
  const grade = getGrade(totalPct);

  const toggleCategory = (idx: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleReset = () => {
    setScores(CATEGORIES.map((cat) => cat.criteria.map(() => 0)));
    setFormData({
      date: new Date().toISOString().split("T")[0],
      internName: "",
      specialization: "",
      mentorName: "",
      presentationTopic: "",
      batch: "",
    });
    setSaved(false);
  };

  const handleSave = () => {
    if (!formData.internName.trim() || !formData.mentorName.trim()) return;
    setSaving(true);

    const entry = {
      id: `pres_${Date.now()}`,
      ...formData,
      scores: CATEGORIES.map((cat, ci) => ({
        category: cat.name,
        criteria: cat.criteria.map((cr, cri) => ({
          name: cr.name,
          score: scores[ci][cri],
          maxScore: cr.maxScore,
        })),
        total: categoryTotals[ci],
        maxScore: cat.maxScore,
      })),
      totalScore,
      maxScore: MAX_TOTAL,
      grade: grade.label,
      date: formData.date,
      internName: formData.internName,
      specialization: formData.specialization,
      batch: formData.batch,
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem("mentor_presentation_assessments") || "[]"
      );
      existing.push(entry);
      localStorage.setItem(
        "mentor_presentation_assessments",
        JSON.stringify(existing)
      );
      setSaved(true);
    } catch {
      // storage full or error
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = formData.internName.trim() && formData.mentorName.trim();

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-6 font-jakarta text-navy animate-fadeUp">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy">
            Presentation Assessment
          </h1>
          <p className="text-xs text-mist mt-0.5">
            Evaluate intern presentation skills across 6 categories · Total{" "}
            {MAX_TOTAL} points
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate border border-line hover:bg-lightbg transition-colors flex items-center gap-1.5"
          >
            <FiRotateCcw className="text-sm" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue hover:bg-bluelt disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <FiCheckCircle className="text-sm" />
            ) : (
              <FiSave className="text-sm" />
            )}
            {saved ? "Saved" : "Save Assessment"}
          </button>
        </div>
      </div>

      {/* ═══ Overall Score Badge ═══ */}
      <div className="bg-white border border-line rounded-2xl p-5 mb-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#f0f2f5" strokeWidth="7" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke="#d97706"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalPct / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-navy">{totalScore}</span>
            <span className="text-[10px] text-mist">/ {MAX_TOTAL}</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 mb-1">
            <FiAward className="text-lg text-amber-600" />
            <span className="text-sm font-extrabold text-navy">
              Overall Score: {totalPct}%
            </span>
          </div>
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${grade.color}`}>
            {grade.label}
          </span>
        </div>

        <div className="flex-1 w-full sm:w-auto space-y-1.5 sm:pl-6 sm:border-l sm:border-line">
          {CATEGORIES.map((cat, i) => {
            const pct = cat.maxScore > 0 ? Math.round((categoryTotals[i] / cat.maxScore) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-slate w-28 truncate">{cat.name.split("&")[0].trim()}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-navy w-14 text-right">
                  {categoryTotals[i]}/{cat.maxScore}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Form Fields ═══ */}
      <div className="bg-white border border-line rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-extrabold text-navy mb-4 flex items-center gap-2">
          <FiFileText className="text-amber-600" /> Assessment Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              <FiCalendar className="inline text-mist mr-1" /> Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleFieldChange}
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              <FiUser className="inline text-mist mr-1" /> Intern Name *
            </label>
            <input
              type="text"
              name="internName"
              value={formData.internName}
              onChange={handleFieldChange}
              placeholder="Enter intern name"
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleFieldChange}
              placeholder="e.g. Frontend Dev"
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              <FiUser className="inline text-mist mr-1" /> Mentor Name *
            </label>
            <input
              type="text"
              name="mentorName"
              value={formData.mentorName}
              onChange={handleFieldChange}
              placeholder="Enter mentor name"
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Batch
            </label>
            <input
              type="text"
              name="batch"
              value={formData.batch}
              onChange={handleFieldChange}
              placeholder="e.g. Batch 2024-A"
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Presentation Topic
            </label>
            <input
              type="text"
              name="presentationTopic"
              value={formData.presentationTopic}
              onChange={handleFieldChange}
              placeholder="Title of the presentation"
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ═══ Scoring Categories ═══ */}
      <div className="space-y-3">
        {CATEGORIES.map((cat, catIdx) => {
          const expanded = expandedCategories.has(catIdx);
          const catTotal = categoryTotals[catIdx];
          const catPct = cat.maxScore > 0 ? Math.round((catTotal / cat.maxScore) * 100) : 0;

          return (
            <div
              key={catIdx}
              className="bg-white border border-line rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => toggleCategory(catIdx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-lightbg/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-sm font-extrabold flex-shrink-0">
                    {catIdx + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-navy truncate">{cat.name}</h3>
                    <p className="text-[11px] text-mist">
                      {cat.criteria.length} criteria · Max {cat.maxScore} pts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-navy min-w-[40px] text-right">
                      {catTotal}/{cat.maxScore}
                    </span>
                  </div>
                  {expanded ? <FiChevronUp className="text-mist" /> : <FiChevronDown className="text-mist" />}
                </div>
              </button>

              {expanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-line pt-4">
                  {cat.criteria.map((criterion, critIdx) => {
                    const val = scores[catIdx][critIdx];
                    const critPct = criterion.maxScore > 0 ? Math.round((val / criterion.maxScore) * 100) : 0;
                    return (
                      <div key={critIdx}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-slate">{criterion.name}</span>
                          <span className="text-xs font-bold text-navy">
                            {val} <span className="text-mist font-normal">/ {criterion.maxScore}</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-mist mb-1.5">{criterion.desc}</p>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={criterion.maxScore}
                            step={1}
                            value={val}
                            onChange={(e) => setScore(catIdx, critIdx, Number(e.target.value))}
                            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-gray-100
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-4
                              [&::-webkit-slider-thumb]:h-4
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-amber-500
                              [&::-webkit-slider-thumb]:shadow-sm
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:transition-transform
                              [&::-webkit-slider-thumb]:hover:scale-110
                              [&::-moz-range-thumb]:w-4
                              [&::-moz-range-thumb]:h-4
                              [&::-moz-range-thumb]:rounded-full
                              [&::-moz-range-thumb]:bg-amber-500
                              [&::-moz-range-thumb]:border-0
                              [&::-moz-range-thumb]:shadow-sm
                              [&::-moz-range-thumb]:cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #f59e0b ${critPct}%, #f0f2f5 ${critPct}%)`,
                            }}
                          />

                          <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: criterion.maxScore + 1 }, (_, i) => i).map((n) => (
                              <button
                                key={n}
                                onClick={() => setScore(catIdx, critIdx, n)}
                                className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${
                                  val === n
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "bg-lightbg text-slate hover:bg-amber-50 hover:text-navy"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <span className="text-xs font-bold text-navy">Category Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${catPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-extrabold text-navy">
                        {catTotal}/{cat.maxScore}
                      </span>
                      <span className="text-[10px] text-mist">({catPct}%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ Bottom Save Bar ═══ */}
      <div className="sticky bottom-0 mt-5 bg-white/80 backdrop-blur-sm border border-line rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold text-navy">
            Total: {totalScore}/{MAX_TOTAL}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${grade.color}`}>
            {grade.label}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue hover:bg-bluelt disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <FiCheckCircle />
          ) : (
            <FiSave />
          )}
          {saved ? "Saved" : "Save Assessment"}
        </button>
      </div>
    </div>
  );
};

export default PresentationAssessment;
