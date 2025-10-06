import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../utils/redis';
import { AdEntry } from '../../models/types';

export const GET = withRedis(async (_request: NextRequest, redis) => {
  const ads = await redis.getAllAds();
  return NextResponse.json(ads);
});

export const POST = withRedis(async (request: NextRequest, redis) => {
  const body = await request.json();
  const { name, bidPrice, promptContent } = body;

  if (!name || bidPrice === undefined || !promptContent) {
    return NextResponse.json(
      { error: 'name, bidPrice, and promptContent are required' },
      { status: 400 }
    );
  }

  const adId = await redis.generateId('ad');
  const ad: AdEntry = {
    id: adId,
    userId: '1', // Placeholder user ID as requested
    name,
    bidPrice: parseFloat(bidPrice),
    promptContent
  };

  await redis.saveAd(ad);
  return NextResponse.json(ad, { status: 201 });
});
