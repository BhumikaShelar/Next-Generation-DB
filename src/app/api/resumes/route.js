import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Resume from '@/lib/models/Resume';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // Verify session
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const decoded = verifyToken(sessionCookie);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired' }, { status: 401 });
    }

    const isUser = decoded.role === 'user';
    const filter = isUser ? { userId: decoded.userId } : {};

    // Fetch resumes history sorted by date descending
    const resumes = await Resume.find(filter).sort({ uploadDate: -1 });

    // Setup Aggregation Pipeline
    const pipeline = [];
    
    // If candidate, filter stats by user ID
    if (isUser) {
      pipeline.push({
        $match: { userId: new mongoose.Types.ObjectId(decoded.userId) }
      });
    }

    // Add Facets stage for stats
    pipeline.push({
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              avgScore: { $avg: '$analysis.score' },
            },
          },
        ],
        matchedSkills: [
          { $unwind: '$analysis.matchedSkills' },
          {
            $group: {
              _id: '$analysis.matchedSkills',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
        missingSkills: [
          { $unwind: '$analysis.missingSkills' },
          {
            $group: {
              _id: '$analysis.missingSkills',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
      },
    });

    const statsResult = await Resume.aggregate(pipeline);

    const summary = statsResult[0]?.summary[0] || { totalCount: 0, avgScore: 0 };
    const matchedSkills = statsResult[0]?.matchedSkills || [];
    const missingSkills = statsResult[0]?.missingSkills || [];

    const stats = {
      totalResumes: summary.totalCount,
      averageScore: Math.round(summary.avgScore || 0),
      topMatchedSkills: matchedSkills,
      topMissingSkills: missingSkills,
    };

    return NextResponse.json({ resumes, stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes and statistics' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();

    // Verify session
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const decoded = verifyToken(sessionCookie);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Role Security: Candidates can only delete their own resumes. Admins can delete any resume.
    if (decoded.role !== 'admin' && resume.userId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden: You cannot delete this analysis' }, { status: 403 });
    }

    await Resume.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Resume deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
