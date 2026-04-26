'use client';

import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStepper, FormStep } from './form-stepper';
import { FormCard } from './form-section';
import { FormFieldWrapper, FormSection } from './form-section';
import { FormFeedback, FormSubmitState } from './form-feedback';
import { StepNavigation } from './form-actions';
import { FormInput } from './form-input';
import { FormTextarea } from './form-textarea';
import { PhoneInput } from './phone-input';
import { ImageUploadPreview } from './image-upload-preview';

interface PetitionFormState {
  title: string;
  description: string;
  category: string;
  contact_email: string;
  contact_phone: string;
  image?: File;
  imagePreview?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  contact_email?: string;
  contact_phone?: string;
}

const categories = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'justice', label: 'Justice' },
  { value: 'environment', label: 'Environment' },
  { value: 'economy', label: 'Economy' },
  { value: 'other', label: 'Other' },
];

const validateField = (field: string, value: string): string | undefined => {
  switch (field) {
    case 'title':
      if (!value?.trim()) return 'Title is required';
      if (value.length < 10) return 'Title must be at least 10 characters';
      if (value.length > 120) return 'Title must be less than 120 characters';
      return undefined;
    case 'description':
      if (!value?.trim()) return 'Description is required';
      if (value.length < 50) return 'Description must be at least 50 characters';
      if (value.length > 3000) return 'Description must be less than 3000 characters';
      return undefined;
    case 'category':
      if (!value) return 'Category is required';
      return undefined;
    case 'contact_email':
      if (!value?.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
      return undefined;
    case 'contact_phone':
      if (!value?.trim()) return 'Phone is required';
      if (!/^\+?1?\s?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/.test(value.replace(/\D/g, '')))
        return 'Invalid phone number';
      return undefined;
    default:
      return undefined;
  }
};

interface PetitionWizardFormProps {
  onSuccess?: (data: PetitionFormState) => void;
  isDraft?: boolean;
}

export function PetitionWizardForm({ onSuccess, isDraft = true }: PetitionWizardFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [submitState, setSubmitState] = useState<FormSubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<PetitionFormState>({
    title: '',
    description: '',
    category: '',
    contact_email: '',
    contact_phone: '',
  });

  const steps = [
    {
      id: 'details',
      label: 'Petition Details',
      description: 'Tell us about your petition',
    },
    {
      id: 'impact',
      label: 'Impact & Goals',
      description: 'Describe the change you want',
    },
    {
      id: 'contact',
      label: 'Contact Info',
      description: 'How we can reach you',
    },
    {
      id: 'review',
      label: 'Review & Submit',
      description: 'Confirm your petition',
    },
  ];

  const handleFieldChange = (field: keyof PetitionFormState, value: string) => {
    setFormData({ ...formData, [field]: value });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleImageChange = (file: File, preview: string) => {
    setFormData({ ...formData, image: file, imagePreview: preview });
  };

  const isStepValid = (): boolean => {
    const fieldsToCheck: Record<number, Array<keyof PetitionFormState>> = {
      0: ['title', 'category'],
      1: ['description'],
      2: ['contact_email', 'contact_phone'],
      3: ['title', 'description', 'category', 'contact_email', 'contact_phone'],
    };

    const fields = fieldsToCheck[currentStep] || [];
    return fields.every(field => {
      const value = formData[field];
      if (typeof value === 'string') {
        return !validateField(field, value);
      }
      return true; // Skip validation for File fields
    });
  };

  const handleNextStep = () => {
    if (!isStepValid()) return;

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitState('submitting');
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('contact_email', formData.contact_email);
      submitData.append('contact_phone', formData.contact_phone);
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      submitData.append('is_draft', isDraft.toString());

      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/petitions', {
      //   method: 'POST',
      //   body: submitData,
      // });

      setSubmitState('success');
      setSubmitSuccess(isDraft ? 'Petition saved as draft!' : 'Petition submitted successfully!');

      if (onSuccess) {
        onSuccess(formData);
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setSubmitState('idle');
        setCurrentStep(0);
        setCompletedSteps([]);
        setFormData({
          title: '',
          description: '',
          category: '',
          contact_email: '',
          contact_phone: '',
        });
      }, 2000);
    } catch (error) {
      setSubmitState('error');
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit petition');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full max-w-2xl mx-auto px-4 py-6"
    >
      <FormCard>
        {/* Stepper */}
        <FormStepper
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={(index) => {
            if (completedSteps.includes(index) || index === currentStep) {
              setCurrentStep(index);
            }
          }}
        />

        {/* Step 1: Petition Details */}
        <FormStep isActive={currentStep === 0} title="Petition Details" subtitle="Give your petition a clear title and select a category">
          <div className="space-y-6">
            <FormSection title="Basic Information" description="These details will be publicly visible">
              <FormFieldWrapper label="Petition Title" required error={errors.title}>
                <FormInput
                  ref={undefined}
                  type="text"
                  placeholder="e.g., Improve Healthcare Access in Liberia"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  maxLength={120}
                />
              </FormFieldWrapper>

              <FormFieldWrapper label="Category" required error={errors.category}>
                <select
                  value={formData.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFieldChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </FormFieldWrapper>
            </FormSection>
          </div>
        </FormStep>

        {/* Step 2: Impact & Goals */}
        <FormStep isActive={currentStep === 1} title="Impact & Goals" subtitle="Explain what change you want to see and why">
          <div className="space-y-6">
            <FormSection title="Petition Description" description="Be detailed and persuasive">
              <FormFieldWrapper label="What's this petition about?" required error={errors.description}>
                <FormTextarea
                  ref={undefined}
                  placeholder="Describe the issue, impact, and what change you're requesting..."
                  value={formData.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('description', e.target.value)}
                  maxLength={3000}
                  rows={6}
                />
              </FormFieldWrapper>

              <FormFieldWrapper label="Supporting Image (Optional)" description="Add a compelling image to your petition">
                <ImageUploadPreview
                  onImageSelect={(file, preview) => handleImageChange(file, preview)}
                  maxSize={5}
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                />
              </FormFieldWrapper>
            </FormSection>
          </div>
        </FormStep>

        {/* Step 3: Contact Info */}
        <FormStep isActive={currentStep === 2} title="Contact Information" subtitle="How can we reach you?">
          <div className="space-y-6">
            <FormSection title="Your Details" description="So we can contact you about your petition">
              <FormFieldWrapper label="Email Address" required error={errors.contact_email}>
                <FormInput
                  ref={undefined}
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.contact_email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('contact_email', e.target.value)}
                />
              </FormFieldWrapper>

              <FormFieldWrapper label="Phone Number" required error={errors.contact_phone}>
                <PhoneInput
                  ref={undefined}
                  placeholder="(555) 123-4567"
                  value={formData.contact_phone}
                  onChange={(value: string) => handleFieldChange('contact_phone', value)}
                />
              </FormFieldWrapper>
            </FormSection>
          </div>
        </FormStep>

        {/* Step 4: Review & Submit */}
        <FormStep isActive={currentStep === 3} title="Review Your Petition" subtitle="Make sure everything looks correct">
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Title</h4>
                <p className="text-zinc-700 dark:text-zinc-300">{formData.title}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Category</h4>
                <p className="text-zinc-700 dark:text-zinc-300">
                  {categories.find((c) => c.value === formData.category)?.label}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Description</h4>
                <p className="text-zinc-700 dark:text-zinc-300 line-clamp-4">{formData.description}</p>
              </motion.div>

              {formData.imagePreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Image</h4>
                  <img
                    src={formData.imagePreview}
                    alt="Petition"
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Contact</h4>
                <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>Email: {formData.contact_email}</p>
                  <p>Phone: {formData.contact_phone}</p>
                </div>
              </motion.div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              By submitting, you agree to our Terms of Service and acknowledge that your petition will be publicly visible.
            </p>
          </div>
        </FormStep>

        {/* Feedback Messages */}
        {submitState !== 'idle' && (
          <FormFeedback
            state={submitState}
            successMessage={submitSuccess || 'Petition submitted successfully!'}
            errorMessage={submitError || 'Something went wrong. Please try again.'}
            onDismiss={() => setSubmitState('idle')}
          />
        )}

        {/* Navigation */}
        <StepNavigation
          canPreviousStep={currentStep > 0}
          canNextStep={isStepValid()}
          onPrevious={handlePreviousStep}
          onNext={handleNextStep}
          onSubmit={handleSubmit}
          isLastStep={currentStep === steps.length - 1}
          isSubmitLoading={submitState === 'submitting'}
          previousLabel="Previous"
          nextLabel="Next"
          submitLabel={isDraft ? 'Save as Draft' : 'Submit Petition'}
          className="mt-8"
        />
      </FormCard>
    </motion.div>
  );
}
