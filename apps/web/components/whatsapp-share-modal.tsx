import React, { useState, useEffect } from 'react';
import { Copy, MessageCircle, Share2, X } from 'lucide-react';

interface WhatsAppShareModalProps {
  petitionId: string;
  petitionTitle: string;
  onClose: () => void;
  isOpen: boolean;
  signerName?: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  petitionId,
  petitionTitle,
  onClose,
  isOpen,
  signerName,
}) => {
  const [message, setMessage] = useState<string>('');
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');

  // Generate message when modal opens
  useEffect(() => {
    if (isOpen && petitionId) {
      generateMessage();
    }
  }, [isOpen, petitionId]);

  const generateMessage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petitionId,
          signerName: signerName || 'A concerned Liberian',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate message');

      const data = await response.json();
      setMessage(data.message);

      // Create referral and get share URL
      const referralResponse = await fetch('/api/whatsapp/create-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petitionId }),
      });

      if (referralResponse.ok) {
        const referralData = await referralResponse.json();
        setReferralCode(referralData.referralCode);
        setWhatsappUrl(referralData.shareUrl);
      }
    } catch (error) {
      console.error('Failed to generate message:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openWhatsApp = () => {
    if (!message) return;
    
    // Get user's phone number from localStorage or prompt
    let userPhone = localStorage.getItem('userPhone');
    
    if (!userPhone) {
      userPhone = prompt('Enter recipient WhatsApp number (with country code, e.g., +231886123456):');
      if (userPhone) {
        localStorage.setItem('userPhone', userPhone);
      }
    }

    if (userPhone) {
      const encodedMessage = encodeURIComponent(message);
      const cleanPhone = userPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('231') ? cleanPhone : cleanPhone.replace(/^0+/, '231');
      
      const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      window.open(whatsappLink, '_blank');
    }
  };

  const shareViaLink = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Share on WhatsApp 🇱🇷</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full" />
              </div>
              <p className="mt-2 text-gray-600">Generating message...</p>
            </div>
          )}

          {/* Message Preview */}
          {!loading && message && (
            <>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {message}
                </p>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                {/* WhatsApp Direct */}
                <button
                  onClick={openWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Open WhatsApp
                </button>

                {/* Copy to Clipboard */}
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  {copied ? 'Copied!' : 'Copy Message'}
                </button>

                {/* Share Link */}
                {whatsappUrl && (
                  <button
                    onClick={shareViaLink}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 border border-blue-200"
                  >
                    <Share2 className="w-5 h-5" />
                    Get Share Link
                  </button>
                )}
              </div>

              {/* Motivation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> Each person you refer that signs the petition earns you <strong>+5 trust points</strong>! Help change Liberia today.
                </p>
              </div>

              {/* Referral Code */}
              {referralCode && (
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-gray-500">Your referral code</p>
                  <p className="text-lg font-mono font-bold text-gray-700">{referralCode}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppShareModal;
