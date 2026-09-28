import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  summary: {
    type: String,
    required: true,
  },
  matchedSkills: [{
    type: String,
  }],
  missingSkills: [{
    type: String,
  }],
  suggestions: [{
    type: String,
  }],
  educationMatch: {
    type: String,
  },
  experienceMatch: {
    type: String,
  },
});

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploaderUsername: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  extractedText: {
    type: String,
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  analysis: {
    type: AnalysisSchema,
    required: true,
  },
});

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
