'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  completedSteps?: number[];
}

export function FormStepper({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
}: FormStepperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Mobile: Vertical stepper */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.includes(index);
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <motion.button
              key={step.id}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              whileHover={isClickable ? { scale: 1.02 } : {}}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : isCompleted
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                }
                ${!isClickable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm
                    ${isActive
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                      : isCompleted
                        ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${
                    isActive
                      ? 'text-emerald-900 dark:text-emerald-100'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:flex gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.includes(index);
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <motion.div key={step.id} className="flex-1 flex flex-col items-center">
              <motion.button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.1 } : {}}
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${isActive
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg'
                    : isCompleted
                      ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }
                `}
              >
                {isCompleted ? (
                  <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs font-medium mt-2 text-center text-zinc-700 dark:text-zinc-300"
              >
                {step.label}
              </motion.p>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`
                    h-1 flex-1 mt-5 mx-1 rounded-full origin-left
                    ${isCompleted
                      ? 'bg-emerald-500 dark:bg-emerald-600'
                      : 'bg-zinc-200 dark:bg-zinc-800'
                    }
                  `}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface FormStepProps {
  children: ReactNode;
  isActive: boolean;
  title: string;
  subtitle?: string;
}

export function FormStep({ children, isActive, title, subtitle }: FormStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 20 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={isActive ? 'block' : 'hidden'}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">{subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
