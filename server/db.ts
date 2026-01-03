import mongoose from 'mongoose';
import Logger from './utils/logger';


const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      Logger.error('MONGO_URI is not defined in your .env file');
      throw new Error('MONGO_URI is not defined in your .env file');
    }

    const conn = await mongoose.connect(mongoUri);
    Logger.info(`MongoDB Connected: ${conn.connection.host}`); 
  } 
  catch (error) {
    Logger.error(`Error connecting to MongoDB:`, (error as Error).message);
    process.exit(1); 
  }
};

export default connectDB;