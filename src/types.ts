export enum Collection {
  NOTES = 'notes',
  USERS = 'users',
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: { toDate: () => Date }; // Improved type for Firestore Timestamp
  updatedAt: { toDate: () => Date }; // Improved type for Firestore Timestamp
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
