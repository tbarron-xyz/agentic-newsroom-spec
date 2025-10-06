import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../../utils/redis';

export const GET = withRedis(async (
  request: NextRequest,
  redis,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: adId } = await context.params;

  const ad = await redis.getAd(adId);
  if (!ad) {
    return NextResponse.json(
      { error: 'Ad not found' },
      { status: 404 }
    );
  }
  return NextResponse.json(ad);
});

export const PUT = withRedis(async (
  request: NextRequest,
  redis,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: adId } = await context.params;
  const body = await request.json();
  const { name, bidPrice, promptContent, userId } = body;

  // Check if ad exists
  const existingAd = await redis.getAd(adId);
  if (!existingAd) {
    return NextResponse.json(
      { error: 'Ad not found' },
      { status: 404 }
    );
  }

  // Update the ad
  const updates: Partial<typeof existingAd> = {};
  if (name !== undefined) updates.name = name;
  if (bidPrice !== undefined) updates.bidPrice = parseFloat(bidPrice);
  if (promptContent !== undefined) updates.promptContent = promptContent;
  if (userId !== undefined) updates.userId = userId;

  await redis.updateAd(adId, updates);

  // Get the updated ad
  const updatedAd = await redis.getAd(adId);
  return NextResponse.json(updatedAd);
});

export const DELETE = withRedis(async (
  request: NextRequest,
  redis,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: adId } = await context.params;

  // Check if ad exists
  const existingAd = await redis.getAd(adId);
  if (!existingAd) {
    return NextResponse.json(
      { error: 'Ad not found' },
      { status: 404 }
    );
  }

  await redis.deleteAd(adId);
  return NextResponse.json({ message: 'Ad deleted successfully' });
});
