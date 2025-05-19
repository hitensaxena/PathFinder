
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';

const LEARNING_PATHS_COLLECTION = 'learningPaths';

export interface SavedLearningPath extends GenerateLearningPathOutput {
  id: string;
  userId: string;
  createdAt: Timestamp; // Or Date, depending on how you retrieve/transform
}

export async function saveLearningPath(userId: string, pathData: GenerateLearningPathOutput): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required to save a learning path.');
  }
  if (!pathData || !pathData.modules || pathData.modules.length === 0) {
    throw new Error('Learning path data is invalid or empty.');
  }

  try {
    const docRef = await addDoc(collection(db, LEARNING_PATHS_COLLECTION), {
      userId,
      ...pathData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving learning path: ', error);
    // It's good to throw a more specific error or handle it appropriately
    if (error instanceof Error) {
      throw new Error(`Failed to save learning path: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving the learning path.');
  }
}

export async function getUserLearningPaths(userId: string): Promise<SavedLearningPath[]> {
   if (!userId) {
    throw new Error('User ID is required to fetch learning paths.');
  }
  try {
    const q = query(
      collection(db, LEARNING_PATHS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const paths: SavedLearningPath[] = [];
    querySnapshot.forEach((doc) => {
      // Make sure to cast doc.data() to the correct type, including createdAt
      const data = doc.data() as Omit<SavedLearningPath, 'id'>;
      paths.push({ id: doc.id, ...data });
    });
    return paths;
  } catch (error) {
    console.error('Error fetching learning paths: ', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch learning paths: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching learning paths.');
  }
}
