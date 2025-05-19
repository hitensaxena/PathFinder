
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';
// Removed GenerateModuleContentOutput as it's not directly used here anymore for top-level type, section detail is fine

const LEARNING_PATHS_COLLECTION = 'learningPaths';

interface ModuleSectionDetail {
  sectionTitle: string;
  sectionContent: string;
  recommendedYoutubeVideoQuery: string;
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
}

export interface SavedModuleQuizStatus {
  score: number;
  completed: boolean;
  lastTaken: Timestamp;
}

export interface SavedModuleDetailedContent {
  sections: ModuleSectionDetail[];
  quiz?: SavedModuleQuizStatus; // Added quiz status
}

// This represents the structure we expect when fetching from DB for modulesDetails
interface FetchedSavedModuleDetailedContent {
    sections?: ModuleSectionDetail[];
    quiz?: SavedModuleQuizStatus;
    // For backward compatibility - these fields might exist on older documents
    content?: string; 
    recommendedYoutubeVideoQuery?: string; 
    youtubeSearchQueries?: string[]; 
}


export interface SavedLearningPath extends GenerateLearningPathOutput {
  id: string;
  userId: string;
  learningGoal: string;
  createdAt: Timestamp;
  modulesDetails?: { [moduleIndex: string]: FetchedSavedModuleDetailedContent }; 
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
    querySnapshot.forEach((docSnap) => { 
      const data = docSnap.data() as Omit<SavedLearningPath, 'id' | 'learningGoal' | 'modulesDetails' | 'createdAt'> & { 
        learningGoal?: string;
        modulesDetails?: { [moduleIndex: string]: FetchedSavedModuleDetailedContent };
        createdAt?: Timestamp; 
      };
      paths.push({
        id: docSnap.id,
        userId: data.userId,
        modules: data.modules || [],
        learningGoal: data.learningGoal || "Untitled Learning Path",
        createdAt: data.createdAt || Timestamp.now(), 
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
  detail: Pick<SavedModuleDetailedContent, 'sections'> // Can only update sections here
): Promise<void> {
  if (!pathId) throw new Error('Path ID is required.');
  if (moduleIndex < 0) throw new Error('Module index is invalid.');
  if (!detail || !detail.sections || detail.sections.length === 0) {
    throw new Error('Module detail (sections) is invalid or empty.');
  }

  const pathRef = doc(db, LEARNING_PATHS_COLLECTION, pathId);
  try {
    // We only update the sections part, preserving other potential fields like quiz status
    await updateDoc(pathRef, {
      [`modulesDetails.${String(moduleIndex)}.sections`]: detail.sections,
    });
  } catch (error) {
    console.error(`Error updating module detail for path ${pathId}, module ${moduleIndex}: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update module detail: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating module detail.');
  }
}

export async function updateLearningPathModuleQuizStatus(
  pathId: string,
  moduleIndex: number,
  score: number,
  completed: boolean
): Promise<void> {
  if (!pathId) throw new Error('Path ID is required.');
  if (moduleIndex < 0) throw new Error('Module index is invalid.');
  if (score < 0 || score > 100) throw new Error('Score must be between 0 and 100.');

  const pathRef = doc(db, LEARNING_PATHS_COLLECTION, pathId);
  const quizStatus: SavedModuleQuizStatus = {
    score,
    completed,
    lastTaken: Timestamp.now(),
  };
  try {
    await updateDoc(pathRef, {
      [`modulesDetails.${String(moduleIndex)}.quiz`]: quizStatus,
    });
  } catch (error) {
    console.error(`Error updating quiz status for path ${pathId}, module ${moduleIndex}: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update quiz status: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating quiz status.');
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
