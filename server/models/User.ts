import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passHash: string;
  googleId?: string;
  isPremium: boolean;
  pairedWithUserId?: mongoose.Schema.Types.ObjectId;
  inviteCode?: string;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passHash: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    pairedWithUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inviteCode: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
