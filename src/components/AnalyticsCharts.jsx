import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Code2, Globe, TrendingUp } from 'lucide-react';

export function AnalyticsCharts({ languageBreakdown = [], topReferrers = [], historyLog = [] }) {
  const COLORS = ['#00f0ff', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Language Breakdown */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-glass">
        <h3 className="text-xs font-mono uppercase text-cyan-300 font-bold mb-4 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" /> Language Distribution (Stars)
        </h3>
        {languageBreakdown.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-8 text-center">No language data available.</p>
        ) : (
          <div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageBreakdown}
                    dataKey="stars"
                    nameKey="language"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {languageBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-800 font-mono text-xs">
              {languageBreakdown.map((item, idx) => (
                <div key={item.language} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{item.language}</span>
                  </div>
                  <span className="text-slate-400">{item.stars} stars ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Portfolio Star Growth Curve */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-glass">
        <h3 className="text-xs font-mono uppercase text-emerald-300 font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Historical Star Trajectory
        </h3>
        {historyLog.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-8 text-center">No history logs captured yet.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyLog}>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.slice(5, 10)} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="totalStars" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Top Referrer Traffic Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-glass">
        <h3 className="text-xs font-mono uppercase text-purple-300 font-bold mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" /> Best Referrer Channels (Views)
        </h3>
        {topReferrers.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-8 text-center">No referrer data available.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topReferrers.slice(0, 5)} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
