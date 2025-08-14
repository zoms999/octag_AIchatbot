"""
Document Transformation Engine
Converts query results into thematic documents optimized for RAG system with semantic chunking
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import json
from collections import defaultdict

from database.models import DocumentType

logger = logging.getLogger(__name__)

class DocumentTransformationError(Exception):
    """Raised when document transformation fails"""
    def __init__(self, doc_type: str, error_message: str):
        self.doc_type = doc_type
        self.error_message = error_message
        super().__init__(f"Document transformation failed for {doc_type}: {error_message}")

@dataclass
class TransformedDocument:
    """Container for transformed document data"""
    doc_type: str
    content: Dict[str, Any]
    summary_text: str
    metadata: Dict[str, Any]
    embedding_vector: Optional[List[float]] = None  # 임베딩 단계에서 추가됨

class DocumentTransformer:
    """
    Transforms raw query results into semantic documents optimized for RAG with chunking strategy
    """
    
    def __init__(self):
        # Remove the old transformation_methods approach for better chunking flexibility
        pass
    
    def _safe_get(self, data: List[Dict[str, Any]], index: int = 0, default: Dict[str, Any] = None) -> Dict[str, Any]:
        if default is None:
            default = {}
        if not data or len(data) <= index:
            return default
        return data[index] if data[index] is not None else default
    
    def _safe_get_value(self, data: Dict[str, Any], key: str, default: Any = None) -> Any:
        return data.get(key, default) if data else default

    def _get_skill_level(self, percentile: float) -> str:
        """Determine skill level based on percentile"""
        if percentile >= 90: return "매우 우수 (상위 10%)"
        elif percentile >= 75: return "우수 (상위 25%)"
        elif percentile >= 50: return "보통 (상위 50%)"
        elif percentile >= 25: return "개선 필요"
        else: return "많은 개선 필요"

    # ==================== CHUNKING METHODS ====================
    # These methods create focused, topic-specific documents for better RAG performance
    
    def _chunk_user_profile(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create focused user profile documents"""
        documents = []
        personal_info = self._safe_get(query_results.get("personalInfoQuery", []))
        institute_settings = self._safe_get(query_results.get("instituteSettingsQuery", []))
        
        if not personal_info or 'user_name' not in personal_info:
            return documents

        user_name = self._safe_get_value(personal_info, "user_name", "사용자")

        # 1. Basic Profile Document
        basic_content = {
            "user_name": user_name,
            "age": self._safe_get_value(personal_info, "age"),
            "gender": self._safe_get_value(personal_info, "gender"),
            "birth_date": self._safe_get_value(personal_info, "birth_date")
        }
        
        summary = f"{user_name}님의 기본 정보: {basic_content['age']}세, {basic_content['gender']}"
        documents.append(TransformedDocument(
            doc_type="USER_PROFILE",
            content=basic_content,
            summary_text=summary,
            metadata={"data_sources": ["personalInfoQuery"], "created_at": datetime.now().isoformat(), "sub_type": "basic_info"}
        ))

        # 2. Education Document
        education_info = {
            "education_level": self._safe_get_value(personal_info, "education_level"),
            "school_name": self._safe_get_value(personal_info, "school_name"),
            "school_year": self._safe_get_value(personal_info, "school_year"),
            "major": self._safe_get_value(personal_info, "major")
        }
        
        if education_info.get("school_name") or education_info.get("education_level"):
            edu_summary = f"{user_name}님의 학력: {education_info['education_level']}"
            if education_info.get("school_name"):
                edu_summary += f", {education_info['school_name']}"
            if education_info.get("major"):
                edu_summary += f"에서 {education_info['major']} 전공"
                
            documents.append(TransformedDocument(
                doc_type="USER_PROFILE",
                content=education_info,
                summary_text=edu_summary,
                metadata={"data_sources": ["personalInfoQuery"], "created_at": datetime.now().isoformat(), "sub_type": "education"}
            ))

        # 3. Career Document
        career_info = {
            "job_status": self._safe_get_value(personal_info, "job_status"),
            "company_name": self._safe_get_value(personal_info, "company_name"),
            "job_title": self._safe_get_value(personal_info, "job_title")
        }
        
        if career_info.get("job_status") or career_info.get("company_name"):
            career_summary = f"{user_name}님의 직업 정보: {career_info['job_status']}"
            if career_info.get("company_name"):
                career_summary += f", {career_info['company_name']}"
            if career_info.get("job_title"):
                career_summary += f"에서 {career_info['job_title']} 담당"
                
            documents.append(TransformedDocument(
                doc_type="USER_PROFILE",
                content=career_info,
                summary_text=career_summary,
                metadata={"data_sources": ["personalInfoQuery"], "created_at": datetime.now().isoformat(), "sub_type": "career"}
            ))

        return documents

    def _chunk_personality_analysis(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create detailed personality analysis documents"""
        documents = []
        
        # Main tendency summary
        tendency_data = self._safe_get(query_results.get("tendencyQuery", []))
        top_tendencies = query_results.get("topTendencyQuery", [])
        tendency_stats = query_results.get("tendencyStatsQuery", [])
        
        if tendency_data:
            primary = self._safe_get_value(tendency_data, "Tnd1")
            secondary = self._safe_get_value(tendency_data, "Tnd2")
            tertiary = self._safe_get_value(tendency_data, "Tnd3")
            
            # Find stats for each tendency
            primary_stats = next((s for s in tendency_stats if primary and s.get('tendency_name', '').startswith(primary)), {})
            secondary_stats = next((s for s in tendency_stats if secondary and s.get('tendency_name', '').startswith(secondary)), {})
            tertiary_stats = next((s for s in tendency_stats if tertiary and s.get('tendency_name', '').startswith(tertiary)), {})
            
            content = {
                "primary_tendency": {"name": primary, "percentage": self._safe_get_value(primary_stats, "percentage", 0)},
                "secondary_tendency": {"name": secondary, "percentage": self._safe_get_value(secondary_stats, "percentage", 0)},
                "tertiary_tendency": {"name": tertiary, "percentage": self._safe_get_value(tertiary_stats, "percentage", 0)}
            }
            
            summary = f"주요 성향 분석: 1순위 {primary}({content['primary_tendency']['percentage']}%), 2순위 {secondary}({content['secondary_tendency']['percentage']}%)"
            if tertiary:
                summary += f", 3순위 {tertiary}({content['tertiary_tendency']['percentage']}%)"
                
            documents.append(TransformedDocument(
                doc_type="PERSONALITY_PROFILE",
                content=content,
                summary_text=summary,
                metadata={"data_sources": ["tendencyQuery", "tendencyStatsQuery"], "created_at": datetime.now().isoformat(), "sub_type": "main_tendencies"}
            ))

        # Individual tendency explanations
        tendency1_explain = self._safe_get(query_results.get("tendency1ExplainQuery", []))
        if tendency1_explain and tendency1_explain.get("explanation"):
            primary_name = self._safe_get_value(tendency_data, "Tnd1", "1순위 성향")
            documents.append(TransformedDocument(
                doc_type="PERSONALITY_PROFILE",
                content=tendency1_explain,
                summary_text=f"{primary_name} 성향에 대한 상세 설명: {tendency1_explain['explanation'][:100]}...",
                metadata={"data_sources": ["tendency1ExplainQuery"], "created_at": datetime.now().isoformat(), "sub_type": "tendency_1_explanation"}
            ))

        tendency2_explain = self._safe_get(query_results.get("tendency2ExplainQuery", []))
        if tendency2_explain and tendency2_explain.get("explanation"):
            secondary_name = self._safe_get_value(tendency_data, "Tnd2", "2순위 성향")
            documents.append(TransformedDocument(
                doc_type="PERSONALITY_PROFILE",
                content=tendency2_explain,
                summary_text=f"{secondary_name} 성향에 대한 상세 설명: {tendency2_explain['explanation'][:100]}...",
                metadata={"data_sources": ["tendency2ExplainQuery"], "created_at": datetime.now().isoformat(), "sub_type": "tendency_2_explanation"}
            ))

        # Top tendencies with detailed explanations
        top_tendency_explains = query_results.get("topTendencyExplainQuery", [])
        for i, explain_data in enumerate(top_tendency_explains[:5]):  # Top 5 only
            if explain_data.get("explanation"):
                documents.append(TransformedDocument(
                    doc_type="PERSONALITY_PROFILE",
                    content=explain_data,
                    summary_text=f"{explain_data.get('tendency_name', f'{i+1}순위 성향')} 상세 분석: {explain_data['explanation'][:100]}...",
                    metadata={"data_sources": ["topTendencyExplainQuery"], "created_at": datetime.now().isoformat(), "sub_type": f"top_tendency_detail_{i+1}"}
                ))

        # Strengths and weaknesses
        strengths_weaknesses = query_results.get("strengthsWeaknessesQuery", [])
        if strengths_weaknesses:
            strengths = [sw for sw in strengths_weaknesses if sw.get('type') == 'strength']
            weaknesses = [sw for sw in strengths_weaknesses if sw.get('type') == 'weakness']
            
            if strengths:
                strength_summary = f"주요 강점: {', '.join([s['description'][:50] for s in strengths[:3]])}"
                documents.append(TransformedDocument(
                    doc_type="PERSONALITY_PROFILE",
                    content={"strengths": strengths},
                    summary_text=strength_summary,
                    metadata={"data_sources": ["strengthsWeaknessesQuery"], "created_at": datetime.now().isoformat(), "sub_type": "strengths"}
                ))
            
            if weaknesses:
                weakness_summary = f"개선 영역: {', '.join([w['description'][:50] for w in weaknesses[:3]])}"
                documents.append(TransformedDocument(
                    doc_type="PERSONALITY_PROFILE",
                    content={"weaknesses": weaknesses},
                    summary_text=weakness_summary,
                    metadata={"data_sources": ["strengthsWeaknessesQuery"], "created_at": datetime.now().isoformat(), "sub_type": "weaknesses"}
                ))

        return documents

    def _chunk_thinking_skills(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create focused thinking skills documents"""
        documents = []
        
        # Main thinking skills summary
        thinking_main = self._safe_get(query_results.get("thinkingMainQuery", []))
        if thinking_main:
            summary = f"주요 사고력: {thinking_main.get('main_thinking_skill')}, 부 사고력: {thinking_main.get('sub_thinking_skill')}, 총점: {thinking_main.get('total_score')}"
            documents.append(TransformedDocument(
                doc_type="THINKING_SKILLS",
                content=thinking_main,
                summary_text=summary,
                metadata={"data_sources": ["thinkingMainQuery"], "created_at": datetime.now().isoformat(), "sub_type": "summary"}
            ))

        # Detailed thinking skills comparison
        comparison_data = query_results.get("thinkingSkillComparisonQuery", [])
        if comparison_data:
            # Create individual documents for top skills
            sorted_skills = sorted(comparison_data, key=lambda x: x.get('my_score', 0), reverse=True)
            
            for i, skill in enumerate(sorted_skills[:5]):  # Top 5 skills
                skill_name = skill.get('skill_name')
                my_score = skill.get('my_score', 0)
                avg_score = skill.get('average_score', 0)
                
                summary = f"{skill_name} 사고력: 내 점수 {my_score}점, 평균 {avg_score}점"
                if my_score > avg_score:
                    summary += f" (평균보다 {my_score - avg_score}점 높음)"
                
                documents.append(TransformedDocument(
                    doc_type="THINKING_SKILLS",
                    content=skill,
                    summary_text=summary,
                    metadata={"data_sources": ["thinkingSkillComparisonQuery"], "created_at": datetime.now().isoformat(), "sub_type": f"skill_{i+1}", "skill_name": skill_name}
                ))

        # Detailed thinking explanations
        thinking_details = query_results.get("thinkingDetailQuery", [])
        for detail in thinking_details:
            if detail.get("explanation"):
                skill_name = detail.get('skill_name')
                documents.append(TransformedDocument(
                    doc_type="THINKING_SKILLS",
                    content=detail,
                    summary_text=f"{skill_name} 상세 분석: {detail['explanation'][:100]}...",
                    metadata={"data_sources": ["thinkingDetailQuery"], "created_at": datetime.now().isoformat(), "sub_type": "detail", "skill_name": skill_name}
                ))

        return documents

    def _chunk_career_recommendations(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create separate documents for different types of career recommendations"""
        documents = []

        # Tendency-based job recommendations
        tendency_jobs = query_results.get("careerRecommendationQuery", [])
        if tendency_jobs:
            job_names = [job['job_name'] for job in tendency_jobs[:5]]
            summary = f"성향 기반 추천 직업: {', '.join(job_names)}"
            documents.append(TransformedDocument(
                doc_type="CAREER_RECOMMENDATIONS",
                content={"jobs": tendency_jobs, "recommendation_type": "tendency"},
                summary_text=summary,
                metadata={"data_sources": ["careerRecommendationQuery"], "created_at": datetime.now().isoformat(), "sub_type": "tendency_based"}
            ))

        # Competency-based job recommendations
        competency_jobs = query_results.get("competencyJobsQuery", [])
        if competency_jobs:
            job_names = [job['jo_name'] for job in competency_jobs[:5]]
            summary = f"역량 기반 추천 직업: {', '.join(job_names)}"
            documents.append(TransformedDocument(
                doc_type="CAREER_RECOMMENDATIONS",
                content={"jobs": competency_jobs, "recommendation_type": "competency"},
                summary_text=summary,
                metadata={"data_sources": ["competencyJobsQuery"], "created_at": datetime.now().isoformat(), "sub_type": "competency_based"}
            ))

        # Preference-based job recommendations
        preference_jobs = query_results.get("preferenceJobsQuery", [])
        if preference_jobs:
            # Group by preference type
            pref_groups = defaultdict(list)
            for job in preference_jobs:
                pref_groups[job.get('preference_type', 'unknown')].append(job)
            
            for pref_type, jobs in pref_groups.items():
                job_names = [job['jo_name'] for job in jobs[:3]]
                pref_name = jobs[0].get('preference_name', pref_type)
                summary = f"{pref_name} 선호도 기반 추천 직업: {', '.join(job_names)}"
                documents.append(TransformedDocument(
                    doc_type="CAREER_RECOMMENDATIONS",
                    content={"jobs": jobs, "preference_type": pref_type, "preference_name": pref_name},
                    summary_text=summary,
                    metadata={"data_sources": ["preferenceJobsQuery"], "created_at": datetime.now().isoformat(), "sub_type": f"preference_{pref_type}"}
                ))

        # Job majors recommendations
        job_majors = query_results.get("suitableJobMajorsQuery", [])
        if job_majors:
            summary = f"추천 직업별 관련 전공: {', '.join([jm['jo_name'] for jm in job_majors[:3]])}"
            documents.append(TransformedDocument(
                doc_type="CAREER_RECOMMENDATIONS",
                content={"job_majors": job_majors},
                summary_text=summary,
                metadata={"data_sources": ["suitableJobMajorsQuery"], "created_at": datetime.now().isoformat(), "sub_type": "related_majors"}
            ))

        # Duties recommendations
        duties = query_results.get("dutiesQuery", [])
        if duties:
            duty_names = [duty['du_name'] for duty in duties[:5]]
            summary = f"추천 직무: {', '.join(duty_names)}"
            documents.append(TransformedDocument(
                doc_type="CAREER_RECOMMENDATIONS",
                content={"duties": duties},
                summary_text=summary,
                metadata={"data_sources": ["dutiesQuery"], "created_at": datetime.now().isoformat(), "sub_type": "duties"}
            ))

        return documents

    def _chunk_competency_analysis(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create detailed competency analysis documents"""
        documents = []
        
        competencies = query_results.get("competencyAnalysisQuery", [])
        competency_subjects = query_results.get("competencySubjectsQuery", [])
        talent_list = self._safe_get(query_results.get("talentListQuery", []))

        # Overall competency summary
        if talent_list and talent_list.get("talent_summary"):
            documents.append(TransformedDocument(
                doc_type="COMPETENCY_ANALYSIS",
                content=talent_list,
                summary_text=f"핵심 역량 요약: {talent_list['talent_summary']}",
                metadata={"data_sources": ["talentListQuery"], "created_at": datetime.now().isoformat(), "sub_type": "summary"}
            ))

        # Individual competency details
        subjects_by_competency = defaultdict(list)
        for sub in competency_subjects:
            subjects_by_competency[sub.get('competency_name', '')].append(sub)

        for comp in competencies:
            comp_name = comp.get('competency_name')
            if comp_name:
                related_subjects = subjects_by_competency.get(comp_name, [])
                content = {
                    "competency": comp,
                    "related_subjects": related_subjects
                }
                
                summary = f"{comp_name} 역량: {comp.get('score')}점 (상위 {comp.get('percentile')}%)"
                if related_subjects:
                    subject_names = [s['subject_name'] for s in related_subjects[:3]]
                    summary += f", 관련 과목: {', '.join(subject_names)}"
                
                documents.append(TransformedDocument(
                    doc_type="COMPETENCY_ANALYSIS",
                    content=content,
                    summary_text=summary,
                    metadata={"data_sources": ["competencyAnalysisQuery", "competencySubjectsQuery"], "created_at": datetime.now().isoformat(), "sub_type": f"competency_{comp.get('rank', 0)}", "competency_name": comp_name}
                ))

        return documents

    def _chunk_learning_style(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create learning style documents"""
        documents = []
        
        learning_style = self._safe_get(query_results.get("learningStyleQuery", []))
        learning_chart = query_results.get("learningStyleChartQuery", [])
        subject_ranks = query_results.get("subjectRanksQuery", [])

        if learning_style:
            # Main learning style document
            summary = f"학습 스타일: {learning_style.get('tnd1_name')} 기반"
            if learning_style.get('tnd1_study_tendency'):
                summary += f", 학습 성향: {learning_style['tnd1_study_tendency'][:50]}..."
            
            documents.append(TransformedDocument(
                doc_type="LEARNING_STYLE",
                content=learning_style,
                summary_text=summary,
                metadata={"data_sources": ["learningStyleQuery"], "created_at": datetime.now().isoformat(), "sub_type": "main"}
            ))

        # Subject recommendations
        if subject_ranks:
            top_subjects = subject_ranks[:5]
            subject_names = [s['subject_name'] for s in top_subjects]
            summary = f"추천 학습 과목: {', '.join(subject_names)}"
            
            documents.append(TransformedDocument(
                doc_type="LEARNING_STYLE",
                content={"subjects": top_subjects},
                summary_text=summary,
                metadata={"data_sources": ["subjectRanksQuery"], "created_at": datetime.now().isoformat(), "sub_type": "recommended_subjects"}
            ))

        # Learning method chart data
        if learning_chart:
            style_data = [item for item in learning_chart if item.get('item_type') == 'S']
            method_data = [item for item in learning_chart if item.get('item_type') == 'W']
            
            if style_data:
                documents.append(TransformedDocument(
                    doc_type="LEARNING_STYLE",
                    content={"style_data": style_data},
                    summary_text=f"학습 스타일 분석: {', '.join([s['item_name'] for s in style_data[:3]])}",
                    metadata={"data_sources": ["learningStyleChartQuery"], "created_at": datetime.now().isoformat(), "sub_type": "style_chart"}
                ))
            
            if method_data:
                documents.append(TransformedDocument(
                    doc_type="LEARNING_STYLE",
                    content={"method_data": method_data},
                    summary_text=f"학습 방법 분석: {', '.join([m['item_name'] for m in method_data[:3]])}",
                    metadata={"data_sources": ["learningStyleChartQuery"], "created_at": datetime.now().isoformat(), "sub_type": "method_chart"}
                ))

        return documents

    def _chunk_preference_analysis(self, query_results: Dict[str, List[Dict[str, Any]]]) -> List[TransformedDocument]:
        """Create preference analysis documents"""
        documents = []
        
        preference_stats = self._safe_get(query_results.get("imagePreferenceStatsQuery", []))
        preference_data = query_results.get("preferenceDataQuery", [])

        if preference_stats:
            summary = f"이미지 선호도 검사 통계: 총 {preference_stats.get('total_image_count')}개 이미지 중 {preference_stats.get('response_count')}개 응답 ({preference_stats.get('response_rate')}%)"
            documents.append(TransformedDocument(
                doc_type="PREFERENCE_ANALYSIS",
                content=preference_stats,
                summary_text=summary,
                metadata={"data_sources": ["imagePreferenceStatsQuery"], "created_at": datetime.now().isoformat(), "sub_type": "test_stats"}
            ))

        # Individual preference details
        for i, pref in enumerate(preference_data):
            pref_name = pref.get('preference_name')
            if pref_name:
                summary = f"{pref_name} 선호도: {i+1}순위, 응답률 {pref.get('response_rate')}%"
                if pref.get('description'):
                    summary += f", 설명: {pref['description'][:50]}..."
                
                documents.append(TransformedDocument(
                    doc_type="PREFERENCE_ANALYSIS",
                    content=pref,
                    summary_text=summary,
                    metadata={"data_sources": ["preferenceDataQuery"], "created_at": datetime.now().isoformat(), "sub_type": f"preference_{i+1}", "preference_name": pref_name}
                ))

        return documents
    
    # ==================== MAIN TRANSFORMATION METHOD ====================
    async def transform_all_documents(
        self, 
        query_results: Dict[str, List[Dict[str, Any]]]
    ) -> List[TransformedDocument]:
        """
        Transform query results into semantically chunked documents optimized for RAG
        
        This method creates multiple focused documents instead of a few large ones,
        making it easier for the RAG system to find relevant information.
        """
        all_documents = []
        
        # Define chunking functions and their names for logging
        chunking_functions = [
            ("User Profile", self._chunk_user_profile),
            ("Personality Analysis", self._chunk_personality_analysis),
            ("Thinking Skills", self._chunk_thinking_skills),
            ("Career Recommendations", self._chunk_career_recommendations),
            ("Competency Analysis", self._chunk_competency_analysis),
            ("Learning Style", self._chunk_learning_style),
            ("Preference Analysis", self._chunk_preference_analysis),
        ]
        
        # Execute each chunking function
        for chunk_name, chunk_function in chunking_functions:
            try:
                logger.info(f"Processing {chunk_name} documents...")
                documents = chunk_function(query_results)
                all_documents.extend(documents)
                logger.info(f"Created {len(documents)} {chunk_name} documents")
            except Exception as e:
                logger.error(f"Error processing {chunk_name}: {e}", exc_info=True)
                continue
        
        logger.info(f"Document transformation and chunking completed. Created {len(all_documents)} total documents.")
        
        # Log document type distribution for debugging
        doc_type_counts = defaultdict(int)
        for doc in all_documents:
            doc_type_counts[doc.doc_type] += 1
        
        logger.info(f"Document distribution: {dict(doc_type_counts)}")
        
        return all_documents