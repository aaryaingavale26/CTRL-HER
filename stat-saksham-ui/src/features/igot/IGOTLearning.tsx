import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";

import {
  getIGOTCourses,
  getIGOTProgress,
  getIGOTRecommendations,
} from "./api";

import type {
  IGOTCourse,
  IGOTProgress,
  CourseRecommendation,
} from "./api";

import { SkillGapPanel } from "./SkillGapPanel";
import { IGOTCourseCard } from "./IGOTCourseCard";

export const IGOTLearning = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<IGOTCourse[]>([]);
  const [progress, setProgress] = useState<IGOTProgress[]>([]);
  const [recommendations, setRecommendations] =
    useState<CourseRecommendation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
// Logged-in learner details from AuthContext
const learnerId = user?.cadreId || "";
const role = user?.designation || "";

// Temporary fallback until competency/assessment API is connected
const skillGaps: string[] = [];
  /*
   * Temporary demo learner.
   * Later this will come from AuthContext.
   */
 // const learnerId = "U001";

  /*
   * Temporary demo competency gaps.
   * Later this will come automatically from
   * competency/assessment analysis.
   */
  /*const skillGaps = [
    "Python",
    "Data Analysis",
    "Statistics",
  ];

  const role = "Statistical Officer";*/

const loadIGOTData = async () => {
    if (!learnerId) {
      setError("Learner profile is not available.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        coursesResponse,
        progressResponse,
        recommendationsResponse,
      ] = await Promise.all([
        getIGOTCourses(),

        getIGOTProgress(learnerId),

        getIGOTRecommendations(
          learnerId,
          skillGaps,
          role,
          5
        ),
      ]);

      setCourses(coursesResponse.courses);

      setProgress(progressResponse.progress);

      setRecommendations(
        recommendationsResponse.recommendations
      );
    } catch (err) {
      console.error("iGOT loading error:", err);

      setError(
        "Unable to connect to the iGOT learning service. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!learnerId) return;

    loadIGOTData();
  }, [learnerId, role]);

  const getProgress = (courseId: string) => {
    return progress.find(
      (item) => item.course_id === courseId
    );
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6 text-blue-900 animate-pulse" />
          </div>

          <p className="text-sm font-semibold text-slate-700 mt-4">
            Loading personalized iGOT learning...
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Fetching courses, competency gaps and learning progress
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h2 className="text-sm font-bold text-red-800">
          iGOT Service Unavailable
        </h2>

        <p className="text-xs text-red-700 mt-1">
          {error}
        </p>

        <button
          type="button"
          onClick={loadIGOTData}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">

            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-teal-700">
                Capacity Building
              </p>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                iGOT Personalized Learning
              </h1>
            </div>

          </div>

          <p className="text-xs text-slate-500 mt-3 max-w-2xl">
            Personalized training recommendations based on
            competency gaps, role and learning progress.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <span className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            iGOT Service Connected
          </span>

          <button
            type="button"
            onClick={loadIGOTData}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Skill Gaps */}
      <SkillGapPanel skillGaps={skillGaps} />

      {/* Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

        <div className="flex items-center justify-between mb-5">

          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-900" />

              <h2 className="text-sm font-bold text-slate-900">
                My iGOT Learning Progress
              </h2>
            </div>

            <p className="text-[11px] text-slate-500 mt-1">
              Learning activity from the connected iGOT platform
            </p>
          </div>

          <span className="text-[10px] font-semibold text-slate-500">
            {progress.length} courses
          </span>

        </div>

        {progress.length === 0 ? (
          <p className="text-xs text-slate-500">
            No learning progress available.
          </p>
        ) : (
          <div className="space-y-5">

            {progress.map((item) => {

              const course = courses.find(
                (courseItem) =>
                  courseItem.id === item.course_id
              );

              return (
                <div key={item.course_id}>

                  <div className="flex items-center justify-between mb-1.5">

                    <div className="flex items-center gap-2">

                      {item.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}

                      <span className="text-xs font-semibold text-slate-700">
                        {course?.title || item.course_id}
                      </span>

                    </div>

                    <span className="text-xs font-bold text-blue-900">
                      {item.progress}%
                    </span>

                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-blue-900 rounded-full transition-all"
                      style={{
                        width: `${item.progress}%`,
                      }}
                    />

                  </div>

                  <p className="text-[10px] text-slate-400 mt-1 uppercase">
                    {item.status.replace("_", " ")}
                  </p>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* Recommendations */}
      <section>

        <div className="mb-4">

          <p className="text-[10px] uppercase tracking-wider font-bold text-teal-700">
            AI-Powered Recommendations
          </p>

          <h2 className="text-lg font-bold text-slate-900">
            Recommended Training
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Courses selected according to your identified
            competency gaps and role.
          </p>

        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-xs text-slate-500">
              No personalized recommendations available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {recommendations.map((course) => (
              <IGOTCourseCard
                key={course.course_id}
                course={course}
              />
            ))}

          </div>
        )}

      </section>

      {/* Catalogue */}
      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold text-slate-900">
            iGOT Course Catalogue
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Available training programmes from the connected
            iGOT catalogue.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {courses.map((course) => {

            const courseProgress = getProgress(course.id);

            return (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >

                <div className="flex items-center justify-between">

                  <span className="text-[10px] font-bold uppercase text-blue-900">
                    {course.category}
                  </span>

                  <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-semibold text-slate-600">
                    {course.difficulty}
                  </span>

                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  {course.title}
                </h3>

                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {course.description}
                </p>

                <div className="flex items-center gap-3 mt-4">

                  <span className="text-[10px] text-slate-500">
                    {course.duration_hours} hours
                  </span>

                  <span className="text-[10px] text-slate-500">
                    {course.target_roles.length} target roles
                  </span>

                </div>

                {courseProgress && (
                  <div className="mt-4">

                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-500">
                        Your Progress
                      </span>

                      <span className="font-bold text-blue-900">
                        {courseProgress.progress}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full">

                      <div
                        className="h-full bg-blue-900 rounded-full"
                        style={{
                          width: `${courseProgress.progress}%`,
                        }}
                      />

                    </div>

                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (course.url && course.url !== "#") {
                      window.open(course.url, "_blank");
                    } else {
                      alert(
                        "Official iGOT course URL will be connected after API integration."
                      );
                    }
                  }}
                  className="w-full mt-4 px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800"
                >
                  View Course
                </button>

              </div>
            );
          })}

        </div>

      </section>

    </div>
  );
};

export default IGOTLearning;