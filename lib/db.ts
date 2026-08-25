import mysql from 'mysql2/promise';

/**
 * Creates a connection to the VegKing MySQL database.
 * Ensure your .env.local file has the correct database credentials.
 */
export async function getDbConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'vegking_backend',
  });

  return connection;
}

/**
 * A helper function to execute queries more easily.
 */
export async function executeQuery<T>(query: string, values: any[] = []): Promise<T> {
  const db = await getDbConnection();
  try {
    const [results] = await db.execute(query, values);
    return results as T;
  } finally {
    await db.end();
  }
}
