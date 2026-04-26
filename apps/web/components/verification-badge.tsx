import React from 'react';
import { Shield, CheckCircle2, Phone, Zap } from 'lucide-react';

interface VerificationBadgeProps {
  trustScore?: number;
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED_PHONE' | 'VERIFIED_ID' | 'DIASPORA';
  compact?: boolean;
  showLabel?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  trustScore = 0,
  verificationStatus = 'UNVERIFIED',
  compact = false,
  showLabel = true,
}) => {
  const getTrustLevel = (score: number): string => {
    if (score >= 100) return 'Trusted Champion';
    if (score >= 50) return 'Verified Advocate';
    if (score >= 20) return 'Active Citizen';
    if (score >= 5) return 'New Signer';
    return 'Unverified';
  };

  const getTrustColor = (score: number) => {
    if (score >= 100) return { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-800' };
    if (score >= 50) return { bg: 'bg-green-50', border: 'border-green-300', badge: 'bg-green-100 text-green-800' };
    if (score >= 20) return { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'bg-blue-100 text-blue-800' };
    if (score >= 5) return { bg: 'bg-cyan-50', border: 'border-cyan-300', badge: 'bg-cyan-100 text-cyan-800' };
    return { bg: 'bg-gray-50', border: 'border-gray-300', badge: 'bg-gray-100 text-gray-800' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED_ID':
        return '🆔';
      case 'VERIFIED_PHONE':
        return '📱';
      case 'DIASPORA':
        return '🌍';
      default:
        return '❓';
    }
  };

  const getTrustIcon = (score: number) => {
    if (score >= 100) return '👑';
    if (score >= 50) return '⭐';
    if (score >= 20) return '✓';
    if (score >= 5) return '→';
    return '?';
  };

  const colors = getTrustColor(trustScore);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-lg">{getTrustIcon(trustScore)}</span>
        {showLabel && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.badge}`}>
            {getTrustLevel(trustScore)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-700" />
          <h3 className="font-bold text-gray-900">Verification Status</h3>
        </div>
        <span className="text-2xl">{getTrustIcon(trustScore)}</span>
      </div>

      {/* Trust Level */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Trust Level</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {getTrustLevel(trustScore)}
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${colors.badge}`}>
              {trustScore} points
            </span>
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-700">Progress to Next Level</span>
            <span className="text-xs text-gray-600">
              {trustScore >= 100
                ? '✓ Maximum'
                : trustScore < 5
                  ? '5'
                  : trustScore < 20
                    ? '20'
                    : trustScore < 50
                      ? '50'
                      : '100'}{' '}
              points
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
              style={{
                width: `${trustScore >= 100 ? 100 : trustScore < 5 ? (trustScore / 5) * 100 : trustScore < 20 ? (trustScore / 20) * 100 : trustScore < 50 ? (trustScore / 50) * 100 : (trustScore / 100) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Verification Status */}
        <div className="border-t pt-3">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Verified Info</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getStatusIcon(verificationStatus)}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {verificationStatus === 'VERIFIED_ID'
                  ? 'ID Verified'
                  : verificationStatus === 'VERIFIED_PHONE'
                    ? 'Phone Verified'
                    : verificationStatus === 'DIASPORA'
                      ? 'Diaspora Member'
                      : 'Not Verified'}
              </p>
              <p className="text-xs text-gray-600">
                {verificationStatus === 'VERIFIED_ID'
                  ? 'Government ID verified'
                  : verificationStatus === 'VERIFIED_PHONE'
                    ? 'Phone number verified'
                    : verificationStatus === 'DIASPORA'
                      ? 'Verified diaspora member'
                      : 'Verify to earn trust'}
              </p>
            </div>
          </div>
        </div>

        {/* How to Earn Trust */}
        <div className="bg-white rounded-lg p-3 border">
          <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4" /> How to earn trust
          </p>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• Sign petitions (+1 per petition)</li>
            <li>• Verify phone number (+3)</li>
            <li>• Upload ID document (+10)</li>
            <li>• Refer others who sign (+5 per)</li>
            <li>• Active 7+ days (+2)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerificationBadge;
