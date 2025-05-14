import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Adding database name explicitly as a separate option
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'MockTest'
    });
    console.log(`MongoDB Connected to: ${conn.connection.name}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;