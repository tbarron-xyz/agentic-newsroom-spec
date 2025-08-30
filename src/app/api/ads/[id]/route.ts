import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;
    const redis = new RedisService();
    await redis.connect();

    try {
      const ad = await redis.getAd(adId);
      if (!ad) {
        return NextResponse.json(
          { error: 'Ad not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(ad);
    } finally {
      await redis.disconnect();
    }
  } catch (error) {
    console.error('Error fetching ad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;
    const body = await request.json();
    const { name, bidPrice, promptContent, userId } = body;

    const redis = new RedisService();
    await redis.connect();

    try {
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
    } finally {
      await redis.disconnect();
    }
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;
    const redis = new RedisService();
    await redis.connect();

    try {
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
    } finally {
      await redis.disconnect();
    }
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
