import { Client, Databases } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '69c2395300216ec78422';

export const appwriteClient = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const appwriteDatabases = new Databases(appwriteClient);

export const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
export const APPWRITE_MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
