import { useState, useMemo, useEffect } from "react";
import {
  FiSave,
  FiRotateCcw,
  FiAward,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import { getCategoriesPresentationApi } from "../../services/mentorApi";
import { getBatchesApi, getUserByBatchApi } from "../../services/authApi";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

interface Category {
  categoryId: number;
  categoryName: string;
  totalMarks: number;
  assessmentType: string;
  assessmentTypeId: number;
}

interface Batch {
  id: number | string;
  name: string;
}

interface Intern {
  id: number | string;
  name: string;
}

interface FormData {
  date: string;
  internName: string;
  specialization: string;
  mentorName: string;
  presentationTopic: string;
  batch: string;
}

const getGrade = (pct: number) => {
  if (pct >= 90)
    return {
      label: "Outstanding",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    };
  if (pct >= 75)
    return { label: "Excellent", color: "text-blue bg-sky border-blue/20" };
  if (pct >= 60)
    return {
      label: "Good",
      color: "text-amber-600 bg-amber-50 border-amber-200",
    };
  if (pct >= 45)
    return {
      label: "Average",
      color: "text-orange-600 bg-orange-50 border-orange-200",
    };
  return {
    label: "Needs Improvement",
    color: "text-red-600 bg-red-50 border-red-200",
  };
};

const PresentationAssessment = () => {
  const id = useParams().id;
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    internName: "",
    specialization: "",
    mentorName: "",
    presentationTopic: "",
    batch: "",
  });
  const [scores, setScores] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingInterns, setLoadingInterns] = useState(false);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const res = await getBatchesApi();
        const apiBatches = res.data.map((b: any) => ({
          id: b.id ?? b.batch_id ?? b.batchId,
          name: b.name ?? b.batch_name ?? b.batchName ?? b.id ?? b.batch_id,
        }));
        setBatches(apiBatches);
      } catch (err) {
        toast.error("Error fetching batches");
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, []);

  // Fetch interns when batch changes
  useEffect(() => {
    if (!formData.batch) {
      setInterns([]);
      setFormData((prev) => ({ ...prev, internName: "" }));
      return;
    }
    const fetchInterns = async () => {
      setLoadingInterns(true);
      try {
        const res = await getUserByBatchApi(formData.batch);
        const apiInterns = res.data.map((u: any) => ({
          id: u.id ?? u.user_id ?? u.userid,
          name: u.name ?? u.full_name ?? u.username ?? u.email ?? String(u.id ?? u.user_id),
        }));
        setInterns(apiInterns);
      } catch (err) {
        toast.error("Error fetching interns");
        setInterns([]);
      } finally {
        setLoadingInterns(false);
      }
    };
    fetchInterns();
  }, [formData.batch]);

  useEffect(() => {
    const getCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await getCategoriesPresentationApi(id || "");
        const apiCategories = res.data.map((cat: any) => ({
          categoryId: cat.category_id,
          categoryName: cat.category_name,
          totalMarks: cat.total_marks,
          assessmentType: cat.assessment_type,
          assessmentTypeId: cat.assessment_type_id,
        }));
        setCategories(apiCategories);
        setScores(apiCategories.map(() => 0));
      } catch (err) {
        toast.error("Error fetching categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    getCategories();
  }, [id]);

  const handleScoreChange = (catIdx: number, value: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[catIdx] = value;
      return next;
    });
    setSaved(false);
  };

  const totalScore = useMemo(() => scores.reduce((s, v) => s + v, 0), [scores]);
  const maxTotal = useMemo(() => categories.reduce((s, c) => s + c.totalMarks, 0), [categories]);
  const totalPct = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;
  const grade = getGrade(totalPct);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleReset = () => {
    setScores(categories.map(() => 0));
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
      scores: categories.map((cat, ci) => ({
        category: cat.categoryName,
        score: scores[ci],
        maxScore: cat.totalMarks,
      })),
      totalScore,
      maxScore: maxTotal,
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

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <span className="loader mb-3" />
          <div className="text-amber-700 font-semibold text-lg">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-6 font-jakarta text-navy animate-fadeUp">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-navy">
            Presentation Assessment
          </h1>
          <p className="text-xs text-mist mt-0.5">
            Evaluate intern presentation skills across {categories.length} categories · Total {maxTotal} points
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
        {/* Ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#f0f2f5"
              strokeWidth="7"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#d97706"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - totalPct / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-navy">
              {totalScore}
            </span>
            <span className="text-[10px] text-mist">/ {maxTotal}</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 mb-1">
            <FiAward className="text-lg text-amber-600" />
            <span className="text-sm font-extrabold text-navy">
              Overall Score: {totalPct}%
            </span>
          </div>
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${grade.color}`}
          >
            {grade.label}
          </span>
        </div>

        {/* Category breakdown mini bars */}
        <div className="flex-1 w-full sm:w-auto space-y-1.5 sm:pl-6 sm:border-l sm:border-line">
          {categories.map((cat, i) => {
            const pct = cat.totalMarks > 0 ? Math.round((scores[i] / cat.totalMarks) * 100) : 0;
            return (
              <div key={cat.categoryId} className="flex items-center gap-2">
                <span className="text-[10px] text-slate w-28 truncate">
                  {cat.categoryName}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-navy w-14 text-right">
                  {scores[i]}/{cat.totalMarks}
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
              Batch
            </label>
            <select
              name="batch"
              value={formData.batch}
              onChange={handleFieldChange}
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
            >
              <option value="">Select batch</option>
              {loadingBatches ? (
                <option disabled>Loading...</option>
              ) : (
                batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              <FiUser className="inline text-mist mr-1" /> Intern Name *
            </label>
            <select
              name="internName"
              value={formData.internName}
              onChange={handleFieldChange}
              className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              disabled={!formData.batch || loadingInterns}
            >
              <option value="">{!formData.batch ? "Select batch first" : loadingInterns ? "Loading..." : "Select intern"}</option>
              {interns.map((i) => (
                <option key={i.id} value={i.name}>{i.name}</option>
              ))}
            </select>
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
        {categories.map((cat, catIdx) => (
          <div
            key={cat.categoryId}
            className="bg-white border border-line rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-sm font-extrabold flex-shrink-0">
                  {catIdx + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-navy truncate">
                    {cat.categoryName}
                  </h3>
                  <p className="text-[11px] text-mist">
                    Max {cat.totalMarks} pts
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-navy">
                {scores[catIdx]}/{cat.totalMarks}
              </span>
            </div>
            <div className="px-5 pb-5 border-t border-line pt-4">
              <input
                type="range"
                min={0}
                max={cat.totalMarks}
                step={1}
                value={scores[catIdx] || 0}
                onChange={(e) => handleScoreChange(catIdx, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-100 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
                style={{ background: `linear-gradient(to right, #d97706 ${(scores[catIdx] / cat.totalMarks) * 100}%, #f0f2f5 ${(scores[catIdx] / cat.totalMarks) * 100}%)` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Bottom Save Bar ═══ */}
      <div className="sticky bottom-0 mt-5 bg-white/80 backdrop-blur-sm border border-line rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold text-navy">
            Total: {totalScore}/{maxTotal}
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${grade.color}`}
          >
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
