import API from "./authInstance";

export const submitSoftSkillsAssessmentApi = (data: any) => {
  return API.post("/mentor_assessment/softskills", data);
};

export const getTypes = () => {
  return API.get("/mentor_assessment/types");
};

export const getCategoriesTechnicalApi = (
  assessment_type_id: string | number,
) => {
  return API.get(
    `/mentor_assessment/categories?assessment_type_id=${assessment_type_id}`,
  );
};

export const getCategoriesSoftSkillsApi = (
  assessment_type_id: string | number,
) => {
  return API.get(
    `/mentor_assessment/categories?assessment_type_id=${assessment_type_id}`,
  );
};

export const getCategoriesPresentationApi = (
  assessment_type_id: string | number,
) => {
  return API.get(
    `/mentor_assessment/categories?assessment_type_id=${assessment_type_id}`,
  );
};
