import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid'; // For unique project IDs

/**
 * Initiates the project pipeline.
 * Called immediately when user clicks "Start Analysis"
 */
export async function initializeProject(startupData: {
  name: string;
  description: string;
  industry: string;
  country: string;
  stage?: string;
}) {
  const user = auth.currentUser;
  
  if (!user) throw new Error("User not authenticated");

  const projectId = uuidv4(); // Generate unique ID
  const projectRef = doc(db, `users/${user.uid}/projects/${projectId}`);

  const initialPayload = {
    id: projectId,
    name: startupData.name,
    description: startupData.description,
    industry: startupData.industry,
    country: startupData.country,
    stage: startupData.stage || "Pre-Seed",
    status: "Analyzing",
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    analysisData: {}, // Placeholder
    report: {},       // Placeholder
    investors: [],
    pitchDeck: {}
  };

  // 1. ATOMIC WRITE: Save to database BEFORE starting analysis
  await setDoc(projectRef, initialPayload);
  
  // 2. Return ID to route user to the dashboard while analysis runs in background
  return projectId;
}

/**
 * Saves the finalized analysis results.
 * Called when the background analysis process finishes.
 */
export async function saveAnalysisResult(projectId: string, dataUpdates: any) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const projectRef = doc(db, `users/${user.uid}/projects/${projectId}`);

  await updateDoc(projectRef, {
    ...dataUpdates,
    status: "Complete",
    lastUpdated: serverTimestamp()
  });
}

/**
 * Real-time hook to subscribe to the authenticated user's projects.
 */
export function useUserProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, `users/${user.uid}/projects`),
          orderBy("lastUpdated", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setProjects(data);
      } catch (err) {
        console.warn("Fetch projects failed:", err);
      }
    };

    fetchProjects();
  }, [user]);

  return projects;
}

