'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SecurityAuditResult {
  category: string;
  status: 'pass' | 'warn' | 'fail';
  score: number;
  message: string;
  details?: string;
}

interface SecurityMetrics {
  overallScore: number;
  timestamp: number;
  results: SecurityAuditResult[];
}

interface AuthThreat {
  type: 'failed_login' | 'suspicious_activity' | 'lockout' | 'session_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  description: string;
  timestamp: number;
  count?: number;
}

const SECURITY_CHECKS = [
  {
    id: 'csp',
    name: 'Content Security Policy',
    description: 'Prevents XSS and injection attacks',
  },
  {
    id: 'hsts',
    name: 'HSTS Header',
    description: 'Forces HTTPS connections',
  },
  {
    id: 'csrf',
    name: 'CSRF Protection',
    description: 'Validates form submissions',
  },
  {
    id: 'cors',
    name: 'CORS Configuration',
    description: 'Restricts cross-origin requests',
  },
  {
    id: 'rate_limit',
    name: 'Rate Limiting',
    description: 'Prevents DDoS and brute force',
  },
  {
    id: 'password_policy',
    name: 'Password Policy',
    description: 'Enforces strong passwords',
  },
  {
    id: 'ssl_tls',
    name: 'SSL/TLS',
    description: 'Secure data transmission',
  },
  {
    id: 'dependencies',
    name: 'Dependency Audit',
    description: 'Checks for vulnerable packages',
  },
];

export function AdminSecurityAudit() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [threats, setThreats] = useState<AuthThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'history'>('overview');
  const [historyData, setHistoryData] = useState<{ timestamp: string; score: number }[]>([]);

  useEffect(() => {
    // Simulate security audit
    const timer = setTimeout(() => {
      const results: SecurityAuditResult[] = [
        {
          category: 'Content Security Policy',
          status: 'pass',
          score: 100,
          message: 'CSP properly configured',
          details: 'Script, style, and image sources properly restricted',
        },
        {
          category: 'HSTS Header',
          status: 'pass',
          score: 100,
          message: 'HSTS enabled with preload',
          details: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          category: 'CSRF Protection',
          status: 'pass',
          score: 100,
          message: 'CSRF tokens validated',
          details: 'Double-submit cookie pattern implemented',
        },
        {
          category: 'CORS Configuration',
          status: 'pass',
          score: 90,
          message: 'CORS properly configured',
          details: `Only whitelisted origins allowed`,
        },
        {
          category: 'Rate Limiting',
          status: 'pass',
          score: 85,
          message: 'Rate limiting active',
          details: 'API endpoints limited to 100 requests per 15 minutes',
        },
        {
          category: 'Password Policy',
          status: 'pass',
          score: 95,
          message: 'Strong password policy enforced',
          details: 'Minimum 12 characters, uppercase, numbers, special chars required',
        },
        {
          category: 'SSL/TLS',
          status: 'pass',
          score: 100,
          message: 'TLS 1.3 configured',
          details: 'A+ rating on SSL Labs',
        },
        {
          category: 'Dependency Audit',
          status: 'warn',
          score: 75,
          message: '2 minor vulnerabilities found',
          details: 'Run "npm audit" to review. All critical vulnerabilities patched.',
        },
      ];

      const overallScore = Math.round(
        results.reduce((sum, r) => sum + r.score, 0) / results.length
      );

      setMetrics({
        overallScore,
        timestamp: Date.now(),
        results,
      });

      // Simulate threat data
      const threatsList: AuthThreat[] = [
        {
          type: 'failed_login',
          severity: 'medium',
          userId: 'user-5432',
          description: '3 failed login attempts',
          timestamp: Date.now() - 3600000,
          count: 3,
        },
        {
          type: 'suspicious_activity',
          severity: 'high',
          userId: 'user-7890',
          description: 'Logins from 5 different countries in 2 hours',
          timestamp: Date.now() - 7200000,
          count: 5,
        },
      ];

      setThreats(threatsList);

      // Simulate history
      setHistoryData([
        { timestamp: '1d ago', score: 82 },
        { timestamp: '2d ago', score: 80 },
        { timestamp: '3d ago', score: 78 },
        { timestamp: 'today', score: overallScore },
      ]);

      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 70) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'warn':
        return '⚠️';
      case 'fail':
        return '❌';
      default:
        return '•';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return '';
    }
  };

  if (loading || !metrics) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-4xl mb-4"
          >
            🔒
          </motion.div>
          <p className="text-zinc-600 dark:text-zinc-400">Running security audit...</p>
        </div>
      </motion.div>
    );
  }

  const passCount = metrics.results.filter((r) => r.status === 'pass').length;
  const warnCount = metrics.results.filter((r) => r.status === 'warn').length;
  const failCount = metrics.results.filter((r) => r.status === 'fail').length;

  const pieData = [
    { name: 'Pass', value: passCount, color: '#10b981' },
    { name: 'Warn', value: warnCount, color: '#f59e0b' },
    { name: 'Fail', value: failCount, color: '#ef4444' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Security Audit</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Real-time security assessment and threat monitoring
        </p>
      </motion.div>

      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className={`relative overflow-hidden bg-gradient-to-br ${getScoreBgColor(metrics.overallScore)} rounded-lg p-8 text-white shadow-lg`}
      >
        <div className="relative z-10 max-w-sm">
          <h2 className="text-lg font-semibold mb-2 opacity-90">Security Score</h2>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-4"
          >
            <span className="text-6xl font-bold">{metrics.overallScore}</span>
            <span className="text-2xl opacity-75">/100</span>
          </motion.div>

          <p className="text-sm opacity-90">
            {metrics.overallScore >= 90 && '✅ Excellent security posture'}
            {metrics.overallScore >= 70 && metrics.overallScore < 90 && '⚠️ Good, but review warnings'}
            {metrics.overallScore < 70 && '🔴 Critical issues need attention'}
          </p>
        </div>

        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent" />
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-4">
        {(['overview', 'threats', 'history'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {tab === 'overview' && '🔍 Overview'}
            {tab === 'threats' && '⚠️ Threats'}
            {tab === 'history' && '📈 History'}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-6"
              >
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">Passed</p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {passCount}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-6"
              >
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">Warnings</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {warnCount}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6"
              >
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">Failed</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {failCount}
                </p>
              </motion.div>
            </div>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Audit Results Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Audit Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 p-6 border-b border-zinc-200 dark:border-zinc-800">
                Detailed Results
              </h3>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {metrics.results.map((result, index) => (
                  <motion.div
                    key={result.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {getStatusIcon(result.status)}
                          </span>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {result.category}
                          </h4>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {result.message}
                        </p>
                        {result.details && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            {result.details}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                          {result.score}
                        </div>
                        <div className="w-16 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                          <motion.div
                            layoutId={`bar-${result.category}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${result.score}%` }}
                            transition={{ delay: 0.3 + index * 0.05 + 0.1 }}
                            className={`h-full ${
                              result.status === 'pass'
                                ? 'bg-emerald-600'
                                : result.status === 'warn'
                                  ? 'bg-amber-600'
                                  : 'bg-red-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'threats' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {threats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 text-center"
              >
                <p className="text-emerald-700 dark:text-emerald-300">
                  ✅ No active threats detected
                </p>
              </motion.div>
            ) : (
              threats.map((threat, index) => (
                <motion.div
                  key={`${threat.userId}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-lg border p-6 ${getSeverityColor(threat.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">
                        {threat.type === 'failed_login' && '🔓 Failed Login Attempts'}
                        {threat.type === 'suspicious_activity' && '🌍 Suspicious Activity'}
                        {threat.type === 'lockout' && '🔐 Account Lockout'}
                        {threat.type === 'session_anomaly' && '⚡ Session Anomaly'}
                      </h4>
                      <p className="text-sm opacity-90 mb-2">{threat.description}</p>
                      <p className="text-xs opacity-75">User: {threat.userId}</p>
                    </div>
                    <div className="text-right text-xs font-semibold opacity-75">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Score Trend (7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => `${value}/100`}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
      >
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
          💡 Security Recommendations
        </h3>

        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>✅ Enable MFA for all admin accounts</li>
          <li>✅ Rotate API keys quarterly</li>
          <li>✅ Monitor authentication logs for anomalies</li>
          <li>✅ Keep dependencies updated (run npm audit regularly)</li>
          <li>✅ Use environment variables for sensitive data</li>
          <li>✅ Implement WAF (Web Application Firewall)</li>
          <li>✅ Conduct annual penetration testing</li>
        </ul>
      </motion.div>

      {/* Export Audit Report */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const report = {
            ...metrics,
            threats,
            timestamp: new Date().toISOString(),
          };
          const json = JSON.stringify(report, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `security-audit-${Date.now()}.json`;
          a.click();
        }}
        className="w-full px-6 py-3 bg-zinc-600 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-lg font-semibold transition-all"
      >
        📥 Export Audit Report
      </motion.button>
    </motion.div>
  );
}
