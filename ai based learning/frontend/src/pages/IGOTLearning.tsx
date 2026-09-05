import React, { useEffect, useState } from 'react';

import {
  getIGOTCourses,
  getIGOTProgress,
  getIGOTRecommendations,
  IGOTCourse,
  IGOTProgress,
  CourseRecommendation,
} from '../api/igot';

import { IGOTCourseCard } from '../components/IGOTCourseCard';
import { SkillGapPanel } from '../components/SkillGapPanel';

export const IGOTLearning: React.FC = () => {
  const [courses, setCourses] = useState<IGOTCourse[]>([]);
  const [progress, setProgress] = useState<IGOTProgress[]>([]);
  const [recommendations, setRecommendations] = useState<
    CourseRecommendation[]
  >([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Demo learner
  // Later this will come from logged-in user profile
  const learnerId = 'U001';

  // Demo skill gaps
  // Later we will derive these automatically from learner assessment/progress
  const skillGaps = [
    'Python',
    'Data Analysis',
    'Statistics',
  ];

  const role = 'Statistical Officer';

  useEffect(() => {
    const loadIGOTData = async () => {
      try {
        setLoading(true);
        setError('');

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
        console.error('Failed to load iGOT data:', err);
        setError(
          'Unable to load iGOT learning data. Please check that the backend is running.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadIGOTData();
  }, []);

  const getCourseProgress = (courseId: string) => {
    return progress.find(
      (item) => item.course_id === courseId
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-3xl mb-3">📚</div>

          <p className="text-slate-600">
            Loading iGOT learning data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
        <h2 className="font-semibold">
          Unable to load learning data
        </h2>

        <p className="text-sm mt-1">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <p className="text-sm font-semibold text-indigo-600">
          iGOT Karmayogi Integration
        </p>

        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Personalized Learning
        </h1>

        <p className="text-slate-500 mt-2">
          Discover courses based on your competency gaps,
          role and learning progress.
        </p>
      </div>

      {/* Skill Gaps */}
      <SkillGapPanel skillGaps={skillGaps} />

      {/* Current Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              My iGOT Progress
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Your learning activity on the connected platform
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {progress.length} courses
          </span>
        </div>

        {progress.length === 0 ? (
          <p className="text-sm text-slate-500">
            No learning progress found.
          </p>
        ) : (
          <div className="space-y-4">
            {progress.map((item) => {
              const course = courses.find(
                (courseItem) =>
                  courseItem.id === item.course_id
              );

              return (
                <div key={item.course_id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {course?.title || item.course_id}
                    </span>

                    <span className="text-sm font-semibold text-indigo-600">
                      {item.progress}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{
                        width: `${item.progress}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    {item.status.replace('_', ' ')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Recommended Courses
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Courses selected according to your competency gaps
            and role.
          </p>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-slate-500">
              No recommendations available.
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
      </div>

      {/* All Courses */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            iGOT Course Catalogue
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Courses available through the connected iGOT
            catalogue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => {
            const courseProgress =
              getCourseProgress(course.id);

            return (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-indigo-600">
                  {course.category}
                </p>

                <h3 className="text-lg font-semibold text-slate-900 mt-1">
                  {course.title}
                </h3>

                <p className="text-sm text-slate-600 mt-2">
                  {course.description}
                </p>

                <div className="flex gap-2 mt-4">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                    {course.difficulty}
                  </span>

                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                    {course.duration_hours} hrs
                  </span>
                </div>

                {courseProgress && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">
                        Your Progress
                      </span>

                      <span className="font-semibold">
                        {courseProgress.progress}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${courseProgress.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  className="w-full mt-5 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  onClick={() => {
                    alert(
                      `Opening ${course.title}. Official iGOT course URL will be connected later.`
                    );
                  }}
                >
                  View Course
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default IGOTLearning;