'use client';

import { useParams } from 'next/navigation';
import BusinessProfile from '../../../src/components/BusinessProfile';

export default function BusinessDetailsPage() {
  const params = useParams();
  return <BusinessProfile businessId={params.id as string} />;
}
