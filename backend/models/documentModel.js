const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a document name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  type: {
    type: String,
    required: [true, 'File type is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      access: {
        type: String,
        enum: ['read', 'write'],
        default: 'read'
      }
    }
  ],
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

// Create index on name field for faster search
DocumentSchema.index({ name: 'text' });

module.exports = mongoose.model('Document', DocumentSchema);