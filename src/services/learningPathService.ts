
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';

const LEARNING_PATHS_COLLECTION = 'learningPaths';

export interface SavedModuleDetail {
  content: string;
  youtubeSearchQueries: string[];
}

export interface SavedLearningPath extends GenerateLearningPathOutput {
  id: string;
  userId: string;
  learningGoal: string;
  createdAt: Timestamp;
  modulesDetails?: { [moduleIndex: string]: SavedModuleDetail }; // moduleIndex as string for Firestore map keys
}

export async function saveLearningPath(
  userId: string,
  pathData: GenerateLearningPathOutput,
  learningGoal: string,
  modulesDetails?: { [moduleIndex: string]: SavedModuleDetail }
): Promise<string> {
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
      learningGoal,
      modulesDetails: modulesDetails || {}, // Save module details if provided
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

export async function updateLearningPathModuleDetail(
  pathId: string,
  moduleIndex: number, // Keep as number for consistency with component state
  detail: SavedModuleDetail
): Promise<void> {
  if (!pathId) throw new Error('Path ID is required.');
  if (moduleIndex < 0) throw new Error('Module index is invalid.');
  if (!detail || !detail.content) throw new Error('Module detail is invalid.');

  const pathRef = doc(db, LEARNING_PATHS_COLLECTION, pathId);
  try {
    // Use dot notation to update a specific field in a map
    // Firestore map keys are strings, so convert moduleIndex
    await updateDoc(pathRef, {
      [`modulesDetails.${String(moduleIndex)}`]: detail,
    });
  } catch (error) {
    console.error(`Error updating module detail for path ${pathId}, module ${moduleIndex}: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update module detail: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating module detail.');
  }
}
