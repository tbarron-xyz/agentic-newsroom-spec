import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { AdEntry } from '../../models/types';

export async function GET(_request: NextRequest) {
  try {
    const redis = new RedisService();
    await redis.connect();

    try {
      const ads = await redis.getAllAds();
      return NextResponse.json(ads);
    } finally {
      await redis.disconnect();
    }
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, bidPrice, promptContent } = body;

    if (!name || bidPrice === undefined || !promptContent) {
      return NextResponse.json(
        { error: 'name, bidPrice, and promptContent are required' },
        { status: 400 }
      );
    }

    const redis = new RedisService();
    await redis.connect();

    try {
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
    } finally {
      await redis.disconnect();
    }
  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    );
  }
}
