import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)
console.log("DATABASE_URL:", connectionString);

export default sql