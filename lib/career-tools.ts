export type CvFileInfo = {
  name: string;
  type: "pdf" | "docx";
  size_bytes: number;
  extracted_char_count: number;
  text_truncated: boolean;
};

export type AtsScoreResult = {
  score: number;
  grade: string;
  summary: string;
  sections: {
    structure: number;
    ats_compatibility: number;
    readability: number;
    keyword_match: number;
    impact: number;
  };
  strengths: string[];
  improvements: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  file: CvFileInfo;
  privacy_note: string;
};

export type JobMatchResult = {
  match_score: number;
  match_level: string;
  summary: string;
  breakdown: {
    keyword_overlap: number;
    required_skills: number;
    experience_signals: number;
    ats_readiness: number;
  };
  matched_keywords: string[];
  missing_keywords: string[];
  suggested_cv_updates: string[];
  job: {
    id?: string;
    title?: string;
    company?: string;
    location?: string;
    employment_type?: string;
    work_type?: string;
    category?: string;
  };
  file: CvFileInfo;
  privacy_note: string;
};

export type CareerToolResult =
  | {
      type: "ats";
      data: AtsScoreResult;
    }
  | {
      type: "match";
      data: JobMatchResult;
    };
