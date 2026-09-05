import React from 'react';

interface SkillGapPanelProps {
  skillGaps: string[];
}

export const SkillGapPanel: React.FC<SkillGapPanelProps> = ({
  skillGaps,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Your Skill Gaps
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Competencies recommended for your learning journey
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          🎯
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        {skillGaps.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};