'use client';

import dynamic from 'next/dynamic';

const Model = dynamic(() => import('@/components/3d-model'), { ssr: false });

export default Model;
