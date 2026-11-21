import mongoose from 'mongoose';

export async function connectMongo() {
  if (!process.env.MONGO_URI) return null;
  await mongoose.connect(process.env.MONGO_URI);
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
