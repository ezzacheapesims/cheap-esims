import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { sanitizeInput } from '../../common/utils/sanitize';
import * as crypto from 'crypto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    planId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Validate comment length
    if (!data.comment || data.comment.trim().length < 10) {
      throw new BadRequestException('Comment must be at least 10 characters long');
    }

    if (data.comment.trim().length > 1000) {
      throw new BadRequestException('Comment must be no more than 1000 characters long');
    }

    // Check if user has already reviewed this plan
    const existingReview = await this.prisma.review.findFirst({
      where: {
        planId: data.planId,
        userId: data.userId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this plan');
    }

    // Check if user has purchased this plan (for verified badge)
    const hasPurchased = await this.prisma.order.findFirst({
      where: {
        userId: data.userId,
        planId: data.planId,
        status: 'paid',
      },
    });

    // Sanitize inputs
    const sanitizedComment = sanitizeInput(data.comment);
    const sanitizedUserName = sanitizeInput(data.userName);

    const review = await this.prisma.review.create({
      data: {
        id: crypto.randomUUID(),
        planId: data.planId,
        userId: data.userId,
        userName: sanitizedUserName,
        rating: data.rating,
        comment: sanitizedComment,
        verified: !!hasPurchased,
      },
    });

    this.logger.log(`Review created: ${review.id} for plan ${data.planId} by user ${data.userId}`);
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
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
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
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      verified: review.verified,
      date: review.createdAt.toISOString(),
    }));
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






