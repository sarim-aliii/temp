import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';


export interface IUser extends Document {
  email: string;
  passHash?: string;
  name?: string;
  avatar?: string;
  authMethod?: string; 
  isVerified: boolean;
  
  verificationToken?: string; 
  verificationCode?: string;
  verificationCodeExpires?: Date;
  
  resetPasswordToken?: string;
  resetPasswordExpire?: Date; 
  googleId?: string;
  isPremium: boolean;
  pairedWithUserId?: mongoose.Schema.Types.ObjectId;
  inviteCode?: string;

  password?: string;

  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passHash: { type: String, select: false },
    name: { type: String },
    avatar: { type: String, default: 'https://picsum.photos/200' },
    authMethod: { type: String, default: 'email' },
    isVerified: { type: Boolean, default: false },

    verificationToken: { type: String, select: false },   
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

UserSchema.virtual('password')
  .set(function (password: string) {
    this._password = password;
  })
  .get(function () {
    return this._password;
  });

UserSchema.pre('save', async function (next) {
  const user: any = this;

  if (user._password) {
    const salt = await bcrypt.genSalt(10);
    user.passHash = await bcrypt.hash(user._password, salt);
    user._password = undefined;
  }
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.passHash) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.passHash);
};

export default mongoose.model<IUser>('User', UserSchema);