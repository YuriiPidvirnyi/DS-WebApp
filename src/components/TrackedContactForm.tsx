import { useState } from 'react';
import ContactForm from './ContactForm';
import useAnalytics from '@/hooks/useAnalytics';
import { AnalyticsEventCategory, FormEvent } from '@/utils/analytics';

export default function TrackedContactForm() {
  const analytics = useAnalytics();
  const [formStarted, setFormStarted] = useState(false);

  // Track form start when user interacts with the form
  const handleFormInteraction = () => {
    if (!formStarted) {
      setFormStarted(true);
      analytics.track(
        FormEvent.FormStart,
        AnalyticsEventCategory.Forms,
        {
          form_name: 'contact_form',
          form_location: window.location.pathname,
        }
      );
    }
  };

  // Handle successful form submission
  const handleSuccess = () => {
    analytics.trackForm('contact_form', true, {
      form_location: window.location.pathname,
    });
  };

  return (
    <div onClick={handleFormInteraction} onFocus={handleFormInteraction}>
      <ContactForm onSuccess={handleSuccess} />
    </div>
  );
}