import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [60, 'Project name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    color: {
      type: String,
      default: '#3b82f6',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex code'],
    },
  },
  { timestamps: true }
);

// Index: GET /api/projects (user ke projects, newest first)
projectSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Project', projectSchema);