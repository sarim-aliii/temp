import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  _id: string;
  user: mongoose.Schema.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  author: mongoose.Schema.Types.ObjectId;
  content: string;
  image?: string;
  type: 'moment' | 'thought' | 'memory';
  likes: mongoose.Schema.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    image: { type: String },
    type: { 
      type: String, 
      enum: ['moment', 'thought', 'memory'], 
      default: 'moment' 
    },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IPost>('Post', PostSchema);