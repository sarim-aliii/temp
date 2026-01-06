import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passHash?: string;
  name?: string;
  avatar?: string;
  authMethod?: string; 
  isVerified: boolean;
  
  verificationCode?: string;
  verificationCodeExpires?: Date;
  
  resetPasswordToken?: string;
  resetPasswordExpire?: Date; 
  googleId?: string;
  isPremium: boolean;
  pairedWithUserId?: mongoose.Schema.Types.ObjectId;
  inviteCode?: string;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passHash: { type: String, select: false },
    name: { type: String },
    avatar: { type: String, default: 'https://picsum.photos/200' },
    authMethod: { type: String, default: 'email' },
    isVerified: { type: Boolean, default: false },
  
    verificationCode: { type: String, select: false },
    verificationCodeExpires: { type: Date, select: false },
    
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    googleId: { type: String, sparse: true, unique: true },
    isPremium: { type: Boolean, default: false },
    pairedWithUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    inviteCode: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);