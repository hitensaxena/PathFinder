
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';
import type { GenerateModuleContentOutput } from '@/ai/flows/generate-module-content'; 

const LEARNING_PATHS_COLLECTION = 'learningPaths';

interface ModuleSectionDetail {
  sectionTitle: string;
  sectionContent: string;
  recommendedYoutubeVideoQuery: string;
}

export interface SavedModuleDetailedContent {
  sections: ModuleSectionDetail[];
}

interface FetchedSavedModuleDetailedContent {
    sections?: ModuleSectionDetail[]; // New format
    content?: string; // Old flat content for a whole module
    recommendedYoutubeVideoQuery?: string; // Old single query for a whole module (pre-sections)
    youtubeSearchQueries?: string[]; // Even older array of queries for a whole module
}


export interface SavedLearningPath extends GenerateLearningPathOutput {
  id: string;
  userId: string;
  learningGoal: string;
  createdAt: Timestamp;
  modulesDetails?: { [moduleIndex: string]: FetchedSavedModuleDetailedContent }; // Use Fetched type here
}

export async function saveLearningPath(
  userId: string,
  pathData: GenerateLearningPathOutput,
  learningGoal: string,
  modulesDetails?: { [moduleIndex: string]: SavedModuleDetailedContent } 
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
      modulesDetails: modulesDetails || {}, 
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
    querySnapshot.forEach((docSnap) => { // Renamed doc to docSnap to avoid conflict with doc function from firestore
      const data = docSnap.data() as Omit<SavedLearningPath, 'id' | 'learningGoal' | 'modulesDetails' | 'createdAt'> & { // Ensure createdAt is handled
        learningGoal?: string;
        modulesDetails?: { [moduleIndex: string]: FetchedSavedModuleDetailedContent };
        createdAt?: Timestamp; // Firestore timestamp
      };
      paths.push({
        id: docSnap.id,
        userId: data.userId,
        modules: data.modules || [],
        learningGoal: data.learningGoal || "Untitled Learning Path",
        createdAt: data.createdAt || Timestamp.now(), // Provide a fallback for createdAt
        modulesDetails: data.modulesDetails || {},
      });
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
  moduleIndex: number,
  detail: SavedModuleDetailedContent 
): Promise<void> {
  if (!pathId) throw new Error('Path ID is required.');
  if (moduleIndex < 0) throw new Error('Module index is invalid.');
  if (!detail || !detail.sections || detail.sections.length === 0) {
    throw new Error('Module detail (sections) is invalid or empty.');
  }

  const pathRef = doc(db, LEARNING_PATHS_COLLECTION, pathId);
  try {
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

export async function deleteLearningPath(pathId: string): Promise<void> {
  if (!pathId) {
    throw new Error('Path ID is required to delete a learning path.');
  }
  try {
    const pathRef = doc(db, LEARNING_PATHS_COLLECTION, pathId);
    await deleteDoc(pathRef);
  } catch (error) {
    console.error(`Error deleting learning path ${pathId}: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete learning path: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting the learning path.');
  }
}

export async function updateLearningPathGoal(pathId: string, newLearningGoal: string): Promise<void> {
  if (!pathId) {
    throw new Error('Path ID is required to update the learning goal.');
  }
  if (!newLearningGoal || newLearningGoal.trim() === "") {
    throw new Error('New learning goal cannot be empty.');
  }
  try {
    const pathRef = doc(db, LEARNING_PATHS_COLLECTION, pathId);
    await updateDoc(pathRef, {
      learningGoal: newLearningGoal.trim(),
    });
  } catch (error) {
    console.error(`Error updating learning goal for path ${pathId}: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update learning goal: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating the learning goal.');
  }
}
