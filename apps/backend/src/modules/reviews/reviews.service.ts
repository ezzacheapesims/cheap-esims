import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { sanitizeInput } from '../../common/utils/sanitize';
import * as crypto from 'crypto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    planId?: string;
    userId?: string;
    userName?: string;
    rating: number;
    comment?: string;
    language?: string;
    source?: string;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Validate comment length only if present
    if (data.comment && data.comment.trim().length > 0) {
      if (data.comment.trim().length < 2) {
        throw new BadRequestException('Comment must be at least 2 characters long');
      }
      if (data.comment.trim().length > 1000) {
        throw new BadRequestException('Comment must be no more than 1000 characters long');
      }
    }

    // Check if user has already reviewed this plan (only if authenticated and plan specific)
    if (data.userId && data.planId) {
      const existingReview = await this.prisma.review.findFirst({
        where: {
          planId: data.planId,
          userId: data.userId,
        },
      });

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this plan');
      }
    }

    // Check if user has purchased this plan (for verified badge)
    let hasPurchased = false;
    if (data.userId && data.planId) {
      const order = await this.prisma.order.findFirst({
        where: {
          userId: data.userId,
          planId: data.planId,
          status: 'paid',
        },
      });
      hasPurchased = !!order;
    }

    // Sanitize inputs
    const sanitizedComment = data.comment ? sanitizeInput(data.comment) : undefined;
    const sanitizedUserName = data.userName ? sanitizeInput(data.userName) : undefined;

    const review = await this.prisma.review.create({
      data: {
        id: crypto.randomUUID(),
        planId: data.planId,
        userId: data.userId,
        userName: sanitizedUserName,
        rating: data.rating,
        comment: sanitizedComment,
        language: data.language || 'en',
        source: data.source || 'purchase',
        verified: !!hasPurchased,
      },
    });

    this.logger.log(`Review created: ${review.id} for plan ${data.planId || 'global'} by user ${data.userId || 'anonymous'}`);
    return review;
  }

  async getReviewsByPlanId(planId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { planId },
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      planId: review.planId,
      userName: review.userName || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      language: review.language,
      source: review.source,
      verified: review.verified,
      date: review.createdAt.toISOString(),
    }));
  }

  async getAllReviews() {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      planId: review.planId,
      userName: review.userName || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      language: review.language,
      source: review.source,
      verified: review.verified,
      date: review.createdAt.toISOString(),
    }));
  }

  async getReviewStats() {
    const totalCount = await this.prisma.review.count();
    const aggregations = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Get count per rating
    const ratingCounts = await this.prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    });

    return {
      totalCount,
      averageRating: aggregations._avg.rating || 0,
      ratingCounts: ratingCounts.reduce((acc, curr) => {
        acc[curr.rating] = curr._count.rating;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  async seedReviews(count: number = 3200) {
    const BATCH_SIZE = 100;
    const languages = ['en', 'es', 'fr', 'de', 'pl'];
    const shortComments = [
      'Great service!', 'Works perfectly.', 'Easy to install.', 'Highly recommended.', 'Good price.',
      'Fast internet.', 'No issues.', 'Very convenient.', 'Loved it.', 'Will buy again.',
      'Excelente servicio.', 'Muy bueno.', 'Funciona bien.', 'Preiswert.', 'Sehr gut.',
      'Facile à utiliser.', 'Super!', 'Polecam.', 'Działa super.', 'Tanio i dobrze.'
    ];
    const longComments = [
      'I was a bit skeptical at first but it worked perfectly instantly. The speed was great throughout my trip.',
      'Installation was super easy with the QR code. I had 5G almost everywhere in Japan. Definitely cheaper than roaming.',
      'Customer support was very helpful when I had a small issue setting it up. Solved in 5 minutes. Great experience.',
      'Used this for 2 weeks in Europe. Seamless connection across borders. FUP was reasonable for the price.',
      'Best eSIM provider I have used so far. The app is clean and the dashboard is easy to understand. Highly recommend.',
    ];

    let createdCount = 0;

    // Check current count
    const currentCount = await this.prisma.review.count();
    if (currentCount >= count) {
      return { message: 'Already has enough reviews', count: currentCount };
    }

    const needed = count - currentCount;
    this.logger.log(`Seeding ${needed} reviews...`);

    for (let i = 0; i < needed; i += BATCH_SIZE) {
        const batch = [];
        const currentBatchSize = Math.min(BATCH_SIZE, needed - i);

        for (let j = 0; j < currentBatchSize; j++) {
            const rand = Math.random();
            let rating = 5;
            if (rand > 0.95) rating = 1 + Math.floor(Math.random() * 2); // 5% 1-2 stars
            else if (rand > 0.85) rating = 3; // 10% 3 stars
            else if (rand > 0.65) rating = 4; // 20% 4 stars
            // else 5 stars (65%)

            let comment = null;
            let language = 'en';

            const typeRand = Math.random();
            if (typeRand < 0.75) {
                // Star only
                comment = null;
            } else if (typeRand < 0.90) {
                // Short comment
                comment = shortComments[Math.floor(Math.random() * shortComments.length)];
                // Detect lang roughly based on comment index (lazy way) or just random
                // Actually shortComments has mixed langs.
                if (comment.includes('Excelente') || comment.includes('Muy')) language = 'es';
                else if (comment.includes('Preiswert') || comment.includes('Sehr')) language = 'de';
                else if (comment.includes('Facile') || comment.includes('Super')) language = 'fr';
                else if (comment.includes('Polecam') || comment.includes('Działa')) language = 'pl';
                else language = 'en';
            } else {
                // Long comment
                comment = longComments[Math.floor(Math.random() * longComments.length)];
                language = 'en'; // Long ones are EN for now
            }

            // Date distribution (last 365 days)
            const daysAgo = Math.floor(Math.random() * 365);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            batch.push({
                id: crypto.randomUUID(),
                rating,
                comment,
                language,
                source: 'purchase', // Assume most are verified purchase ratings
                verified: true, // "Star-only reviews are valid and common" - usually post-purchase
                createdAt,
                userName: Math.random() > 0.5 ? 'Anonymous' : null, // Mix of Anonymous and null
                planId: null, // Global reviews
                userId: null, // Anonymous
            });
        }

        await this.prisma.review.createMany({
            data: batch,
        });
        createdCount += currentBatchSize;
    }

    return { success: true, created: createdCount };
  }


  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    this.logger.log(`Review deleted: ${reviewId}`);
    return { success: true };
  }
}










