import { useState, useMemo, useEffect } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import {
  FiSave,
  FiRotateCcw,
  FiAward,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import {
  getCategoriesSoftSkillsApi,
  submitScoreFeedback
} from "../../services/mentorApi";
import {
  getBatchesApi,
  getMeApi,
  getUserByBatchApi,
} from "../../services/authApi";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

// ── Types ──────────────────────────────────────────
interface Category {
  categoryId: number;
  categoryName: string;
  totalMarks: number;
  assessmentType: string;
  assessmentTypeId: number;
  criteria: Criterion[];
}

interface Criterion {
  name: string;
  max: number;
}

interface Batch {
  id: number | string;
  name: string;
}

interface Intern {
  id: number | string;
  name: string;
}

interface SavedSummary {
  totalScore: number;
  totalPct: number;
  categoryScores: number[];
}

// Grade Thresholds
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

// ── Component ──────────────────────────────────────
const SoftSkillsAssessment = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingInterns, setLoadingInterns] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSummary, setSavedSummary] = useState<SavedSummary | null>(null);
  const id = useParams().id;
  const [selectedBatch, setSelectedBatch] = useState("");
  const [mentorId, setMentorId] = useState("");

  const getMentorId = async () => {
    try {
      const response = await getMeApi();
      setMentorId(response.data.user_id);
    } catch (error) {
      console.error("Failed to fetch mentor ID:", error);
      toast.error("Failed to fetch mentor details");
    }
  };

  useEffect(() => {
    getMentorId();
  }, []);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const res = await getBatchesApi();
        const apiBatches = res.data.map((b: number) => ({
          id: b,
          name: `Batch ${b}`,
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

  // Fetch categories from API
  useEffect(() => {
    const getCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await getCategoriesSoftSkillsApi(id || 0);
        const apiCategories = res.data.map((cat: any) => ({
          categoryId: cat.category_id,
          categoryName: cat.category_name,
          totalMarks: cat.total_marks,
          assessmentType: cat.assessment_type,
          assessmentTypeId: cat.assessment_type_id,
          criteria: Array.isArray(cat.criteria)
            ? cat.criteria.map((criterion: any) => ({
                name: criterion.name,
                max: criterion.max,
              }))
            : [],
        }));
        setCategories(apiCategories);
      } catch (err) {
        toast.error("Error fetching categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    getCategories();
  }, [id]);

  // Fetch interns when batch changes

  const fetchInterns = async () => {
    setLoadingInterns(true);
    try {
      const res = await getUserByBatchApi(selectedBatch);
      const apiInterns = res.data.map((u: any) => ({
        userId: u.user_id,
        name: u.username,
        email: u.email,
        batch: u.batch,
        phone: u.phone,
        techStack: u.tech_stack,
      }));
      setInterns(apiInterns);
    } catch (err) {
      toast.error("Error fetching interns");
      setInterns([]);
    } finally {
      setLoadingInterns(false);
    }
  };

  useEffect(() => {
    if (!selectedBatch) {
      setInterns([]);
      return;
    }

    fetchInterns();
  }, [selectedBatch]);

  // Formik initial values and validation
  const initialValues = {
    intern_id: "",
    assessment_type_id: id,
    assessment_date: new Date().toISOString().split("T")[0],
    batch: "",
    remarks: "",
    task_details: "",
    category_marks: categories.map((cat) => ({
      category_id: cat.categoryId,
      criteria_marks: cat.criteria.map((criterion) => ({
        name: criterion.name,
        max: criterion.max,
        marks: 0,
      })),
    })),
  };

  const validationSchema = Yup.object().shape({
    intern_id: Yup.string().required("Intern is required"),
    assessment_type_id: Yup.number().required(),
    assessment_date: Yup.string().required("Date is required"),
    batch: Yup.string().required("Batch is required"),
    remarks: Yup.string(),
    task_details: Yup.string().required("Task details required"),
    category_marks: Yup.array().of(
      Yup.object().shape({
        category_id: Yup.number().required(),
        criteria_marks: Yup.array().of(
          Yup.object().shape({
            name: Yup.string().required(),
            max: Yup.number().required(),
            marks: Yup.number()
              .min(0, "No negative marks")
              .test(
                "max-criteria-score",
                "Marks cannot exceed criterion max",
                function (value) {
                  return value === undefined || value <= this.parent.max;
                },
              )
              .required("Marks required"),
          }),
        ),
      }),
    ),
  });

  const maxTotal = useMemo(
    () => categories.reduce((s, c) => s + c.totalMarks, 0),
    [categories],
  );

  const getCategoryScore = (categoryMark: any) =>
    (categoryMark?.criteria_marks || []).reduce(
      (sum: number, criterion: any) => sum + Number(criterion.marks || 0),
      0,
    );

  // Formik submit handler
  const handleSubmit = async (
    values: any,
    { setSubmitting }: any,
  ) => {
    setSaving(true);
    try {
      const categoryScores = values.category_marks.map((categoryMark: any) =>
        getCategoryScore(categoryMark),
      );
      const totalScore = categoryScores.reduce(
        (sum: number, score: number) => sum + score,
        0,
      );
      const totalPct =
        maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

      // Prepare payload
      const payload = {
        intern_id: Number(values.intern_id),
        mentor_id: Number(mentorId),
        assessment_type_id: Number(id),
        assessment_date: new Date(values.assessment_date).toISOString(),
        batch: String(values.batch),
        remarks: values.remarks || "",
        task_details: values.task_details,
        category_marks: values.category_marks.map((cm: any) => ({
          category_id: Number(cm.category_id),
          marks: Number(
            (cm.criteria_marks || []).reduce(
              (sum: number, criterion: any) => sum + Number(criterion.marks || 0),
              0,
            ),
          ),
        })),
      };
      const response = await submitScoreFeedback(payload);
      console.log("Submitted data:", payload);
      console.log("API response:", response);
      toast.success("Assessment submitted successfully!");
      setSavedSummary({
        totalScore,
        totalPct,
        categoryScores,
      });
      setSaved(true);
    } catch (err) {
      toast.error("Failed to submit assessment");
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <span className="loader mb-3" />
          <div className="text-emerald-700 font-semibold text-lg">
            Loading categories...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-6 font-jakarta text-navy animate-fadeUp">
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => {
          const displayedTotalScore = savedSummary?.totalScore ?? null;
          const displayedTotalPct = savedSummary?.totalPct ?? null;
          const displayedGrade =
            displayedTotalPct !== null ? getGrade(displayedTotalPct) : null;
          return (
            <Form>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-xl font-extrabold text-navy">
                    Soft Skills Assessment
                  </h1>
                  <p className="text-xs text-mist mt-0.5">
                    Evaluate intern soft skills across {categories.length}{" "}
                    categories · Total {maxTotal} points
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="reset"
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate border border-line hover:bg-lightbg transition-colors flex items-center gap-1.5"
                    onClick={() => {
                      setSaved(false);
                      setSavedSummary(null);
                    }}
                  >
                    <FiRotateCcw className="text-sm" /> Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || saving}
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

              {/* Overall Score Badge */}
              <div className="bg-white border border-line rounded-2xl p-5 mb-5 flex flex-col sm:flex-row items-center gap-5">
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
                      stroke="#059669"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (displayedTotalPct ?? 0) / 100)}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold text-navy">
                      {displayedTotalScore ?? "--"}
                    </span>
                    <span className="text-[10px] text-mist">/ {maxTotal}</span>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <FiAward className="text-lg text-emerald-600" />
                    <span className="text-sm font-extrabold text-navy">
                      {displayedTotalPct !== null
                        ? `Overall Score: ${displayedTotalPct}%`
                        : "Overall Score will appear after save"}
                    </span>
                  </div>
                  {displayedGrade && (
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${displayedGrade.color}`}
                    >
                      {displayedGrade.label}
                    </span>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto space-y-1.5 sm:pl-6 sm:border-l sm:border-line">
                  {savedSummary ? (
                    categories.map((cat, i) => {
                      const categoryScore = savedSummary.categoryScores[i] ?? 0;
                      const pct =
                        cat.totalMarks > 0
                          ? Math.round((categoryScore / cat.totalMarks) * 100)
                          : 0;
                      return (
                        <div
                          key={cat.categoryId}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] text-slate w-28 truncate">
                            {cat.categoryName}
                          </span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-navy w-14 text-right">
                            {categoryScore}/{cat.totalMarks}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-mist">
                      Category scores will appear here after saving the assessment.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-white border border-line rounded-2xl p-5 mb-5">
                <h2 className="text-sm font-extrabold text-navy mb-4 flex items-center gap-2">
                  <FiFileText className="text-emerald-600" /> Assessment Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate mb-1">
                      <FiCalendar className="inline text-mist mr-1" /> Date
                    </label>
                    <Field
                      type="date"
                      name="assessment_date"
                      className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate mb-1">
                      Batch
                    </label>
                    <Field
                      as="select"
                      name="batch"
                      className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const batchId = e.target.value;
                        setFieldValue("batch", batchId);
                        setSelectedBatch(batchId);
                        setFieldValue("intern_id", "");
                      }}
                    >
                      <option value="">Select batch</option>
                      {loadingBatches ? (
                        <option disabled>Loading...</option>
                      ) : (
                        batches.map((b) => {
                          if (b.id === -1) return null;
                          return (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          );
                        })
                      )}
                    </Field>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate mb-1">
                      <FiUser className="inline text-mist mr-1" /> Intern *
                    </label>
                    <Field
                      as="select"
                      name="intern_id"
                      className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                      disabled={!values.batch || loadingInterns}
                    >
                      <option value="">
                        {!values.batch
                          ? "Select batch first"
                          : loadingInterns
                            ? "Loading..."
                            : "Select intern"}
                      </option>
                      {interns.map((i: any) => (
                        <option key={i.userId} value={i.userId}>
                          {i.name}
                        </option>
                      ))}
                    </Field>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate mb-1">
                      Task Details *
                    </label>
                    <Field
                      type="text"
                      name="task_details"
                      placeholder="Brief task description"
                      className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate mb-1">
                      Remarks
                    </label>
                    <Field
                      type="text"
                      name="remarks"
                      placeholder="Remarks (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-line text-sm text-navy bg-lightbg placeholder:text-mist focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Scoring Categories */}
              <div className="space-y-3">
                <FieldArray name="category_marks">
                  {() =>
                    categories.map((cat, catIdx) => (
                      <div
                        key={cat.categoryId}
                        className="bg-white border border-line rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm font-extrabold flex-shrink-0">
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
                            {(values.category_marks[catIdx]?.criteria_marks || []).reduce(
                              (sum: number, criterion: any) =>
                                sum + Number(criterion.marks || 0),
                              0,
                            )}
                            /{cat.totalMarks}
                          </span>
                        </div>
                        <div className="px-5 pb-5 border-t border-line pt-4">
                          <div className="space-y-4">
                            {(cat.criteria || []).map((criterion, criterionIdx) => {
                              const criterionScore =
                                values.category_marks[catIdx]?.criteria_marks?.[
                                  criterionIdx
                                ]?.marks || 0;
                              const fillPct =
                                criterion.max > 0
                                  ? (criterionScore / criterion.max) * 100
                                  : 0;

                              return (
                                <div key={`${cat.categoryId}-${criterion.name}`}>
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <div>
                                      <p className="text-xs font-semibold text-navy">
                                        {criterion.name}
                                      </p>
                                      <p className="text-[11px] text-mist">
                                        Max {criterion.max} pts
                                      </p>
                                    </div>
                                    <span className="text-xs font-bold text-navy">
                                      {criterionScore}/{criterion.max}
                                    </span>
                                  </div>
                                  <Field
                                    name={`category_marks[${catIdx}].criteria_marks[${criterionIdx}].marks`}
                                    type="range"
                                    min={0}
                                    max={criterion.max}
                                    step={1}
                                    value={criterionScore}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => {
                                      setSaved(false);
                                      setSavedSummary(null);
                                      setFieldValue(
                                        `category_marks[${catIdx}].criteria_marks[${criterionIdx}].marks`,
                                        Number(e.target.value),
                                      );
                                    }}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-100 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
                                    style={{
                                      background: `linear-gradient(to right, #059669 ${fillPct}%, #f0f2f5 ${fillPct}%)`,
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </FieldArray>
              </div>

              {/* Bottom Save Bar */}
              <div className="sticky bottom-0 mt-5 bg-white/80 backdrop-blur-sm border border-line rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-navy">
                    {displayedTotalScore !== null
                      ? `Total: ${displayedTotalScore}/${maxTotal}`
                      : `Total will appear after save / ${maxTotal}`}
                  </span>
                  {displayedGrade && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${displayedGrade.color}`}
                    >
                      {displayedGrade.label}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || saving}
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
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SoftSkillsAssessment;
