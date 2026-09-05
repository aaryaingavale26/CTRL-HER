import React from 'react';
import { CourseRecommendation } from '../api/igot';

interface IGOTCourseCardProps {
  course: CourseRecommendation;
}

export const IGOTCourseCard: React.FC<IGOTCourseCardProps> = ({
  course,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            iGOT Karmayogi
          </p>

          <h3 className="text-lg font-semibold text-slate-900 mt-1">
            {course.title}
          </h3>
        </div>

        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
          {Math.round(course.match_percentage)}% Match
        </div>
      </div>

      <p className="text-sm text-slate-600 mt-3">
        {course.description}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {course.competencies.map((competency) => (
          <span
            key={competency}
            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs"
          >
            {competency}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
        <div>
          <p className="text-slate-400 text-xs">Difficulty</p>
          <p className="font-medium text-slate-700">
            {course.difficulty}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-xs">Duration</p>
          <p className="font-medium text-slate-700">
            {course.duration_hours} hours
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
        <p className="text-xs text-indigo-500 font-semibold">
          Why this course?
        </p>

        <p className="text-sm text-indigo-900 mt-1">
          {course.reason}
        </p>
      </div>

      <button
        className="w-full mt-5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        onClick={() => {
          if (course.url && course.url !== '#') {
            window.open(course.url, '_blank');
          } else {
            alert('iGOT course link will be connected after official iGOT API integration.');
          }
        }}
      >
        View Course
      </button>
    </div>
  );
};