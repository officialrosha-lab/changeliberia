'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

const DISMISS_KEY = 'cl-install-prompt-dismissed-until';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

function trackOutcome(outcome: string) {
  if (typeof window === 'undefined' || !('gtag' in window)) return;
  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'pwa_install_prompt', {
    outcome,
  });
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((window.navigator as SafariNavigator).standalone === true) return true;
  return false;
}

function isSnoozed(): boolean {
  if (typeof window === 'undefined') return true;
  const until = Number(window.localStorage.getItem(DISMISS_KEY));
  return Number.isFinite(until) && until > Date.now();
}

function snooze() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // localStorage unavailable (private browsing, quota) — dismissal just won't persist
  }
}

function detectIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

export function InstallPrompt() {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'android' | 'ios' | null>(null);
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (isAlreadyInstalled() || isSnoozed()) return;

    if (detectIOSSafari()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing client-only UA detection on mount, matching floating-feedback-widget.tsx's portalRoot pattern
      setMode('ios');
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setMode('android');
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredEvent(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  function handleDismiss(outcome: string) {
    snooze();
    trackOutcome(outcome);
    setVisible(false);
  }

  async function handleInstallClick() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    trackOutcome(outcome);
    setDeferredEvent(null);
    setVisible(false);
    if (outcome === 'dismissed') snooze();
  }

  if (!portalRoot || !visible || !mode) return null;

  const portal = createPortal(
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 safe-bottom">
      <AnimatePresence>
        <motion.div
          key="install-prompt"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-neutral-800 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image src="/icon-192.png" alt="" width={40} height={40} className="w-10 h-10 rounded-lg" />
              <h3 className="text-base font-bold text-white">Install Change Liberia</h3>
            </div>
            <button
              onClick={() => handleDismiss(mode === 'ios' ? 'ios_dismissed' : 'dismissed')}
              className="text-white hover:text-emerald-100 transition flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {mode === 'ios' ? (
              <>
                <p className="text-sm text-zinc-600 dark:text-neutral-400 mb-4">
                  Add Change Liberia to your Home Screen for quick access, just like an app.
                </p>
                <ol className="text-sm text-zinc-700 dark:text-neutral-300 space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <Share className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    Tap the Share icon
                  </li>
                  <li>Then select &ldquo;Add to Home Screen&rdquo;</li>
                </ol>
                <button
                  onClick={() => handleDismiss('ios_instructions_shown')}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium"
                >
                  Got it
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-600 dark:text-neutral-400 mb-4">
                  Add Change Liberia to your home screen for quick, one-tap access.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss('dismissed')}
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-neutral-800 transition font-medium"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium"
                  >
                    Install
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    portalRoot,
  );

  return portal;
}
