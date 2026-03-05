'use client';

import { useEffect, useRef, useState } from 'react';

import type {
  DeliveryFormState,
  PricingFormState,
} from '@/components/confirm-button/types';
import {
  buildDeliveryFormState,
  buildPricingFormState,
  isDeliveryDetailsRequired,
} from '@/components/confirm-button/utils';
import type { Booking } from '@/data-service/bookings';
import type { ContactQuote } from '@/data-service/quotes';
import { hasPricingDetails, useRentalPricing } from '@/hooks/use-rental-pricing';
import { getRentDetails } from '@/lib/rent-details';

type UseSendConfirmStateProps = {
  booking: Booking;
  quote: ContactQuote | null;
};

export const useSendConfirmState = ({
  booking,
  quote,
}: UseSendConfirmStateProps) => {
  const [open, setOpen] = useState(false);
  const { pricingData: pricing, hasQuotePricing: hasQuote } = useRentalPricing({
    booking,
    quote,
  });
  const { delivery } = getRentDetails(booking);

  const [pricingValues, setPricingValues] = useState<PricingFormState>(() =>
    buildPricingFormState(pricing),
  );
  const [deliveryValues, setDeliveryValues] = useState<DeliveryFormState>(() =>
    buildDeliveryFormState(delivery, pricing),
  );
  const deliveryDetailsRequired = isDeliveryDetailsRequired(
    delivery,
    pricingValues.deliveryFee,
  );

  const [deliverySaved, setDeliverySaved] = useState(
    () => !deliveryDetailsRequired,
  );
  const wasDeliveryRequired = useRef(deliveryDetailsRequired);

  useEffect(() => {
    if (hasQuote) return;
    setPricingValues(buildPricingFormState(pricing));
  }, [hasQuote, pricing]);

  useEffect(() => {
    setDeliveryValues(buildDeliveryFormState(delivery, pricing));
  }, [delivery, pricing]);

  useEffect(() => {
    if (!deliveryDetailsRequired) {
      setDeliverySaved(true);
    } else if (!wasDeliveryRequired.current) {
      setDeliverySaved(false);
    }
    wasDeliveryRequired.current = deliveryDetailsRequired;
  }, [deliveryDetailsRequired]);

  const [saved, setSaved] = useState(() => hasPricingDetails(pricing));

  useEffect(() => {
    setSaved(hasPricingDetails(pricing));
  }, [pricing]);

  return {
    open,
    setOpen,
    pricing,
    pricingValues,
    setPricingValues,
    deliveryValues,
    setDeliveryValues,
    deliveryDetailsRequired,
    deliverySaved,
    setDeliverySaved,
    saved,
    setSaved,
  };
};
