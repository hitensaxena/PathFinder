
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GenerateLearningPathOutput, GenerateLearningPathInput } from '@/ai/flows/generate-learning-path';

const LEARNING_PATHS_COLLECTION = 'learningPaths';

export interface SavedLearningPath extends GenerateLearningPathOutput {
  id: string;
  userId: string;
  learningGoal: string; // Added learningGoal
  createdAt: Timestamp;
}

export async function saveLearningPath(userId: string, pathData: GenerateLearningPathOutput, learningGoal: string): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required to save a learning path.');
  }
  if (!pathData || !pathData.modules || pathData.modules.length === 0) {
    throw new Error('Learning path data is invalid or empty.');
  }
  if (!learningGoal) {
    throw new Error('Learning goal is required to save a learning path.');
  }

  try {
    const docRef = await addDoc(collection(db, LEARNING_PATHS_COLLECTION), {
      userId,
      ...pathData,
      learningGoal, // Store learningGoal
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving learning path: ', error);
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
