
import { AppState } from '../types/index';

const STORAGE_KEY = 'linkedin-content-generator-v1';

export interface StoredSession {
  id: string;
  createdAt: string;
  lastModified: string;
  state: AppState;
  version: number;
}

/**
 * Debounce function for auto-saving
 */
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export const storage = {
  /**
   * Saves the current application state to local storage.
   */
  save(state: AppState): void {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      // Fix: Explicitly type sessionId as string to resolve UUID template literal type mismatch
      let sessionId: string = crypto.randomUUID();
      let createdAt = new Date().toISOString();

      if (existing) {
        const parsed: StoredSession = JSON.parse(existing);
        sessionId = parsed.id;
        createdAt = parsed.createdAt;
      }

      const session: StoredSession = {
        id: sessionId,
        createdAt: createdAt,
        lastModified: new Date().toISOString(),
        state: state,
        version: 1
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Storage save failed:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert("Local storage is full. Please clear some space or export your session.");
      }
    }
  },

  /**
   * Loads the application state from local storage.
   */
  load(): AppState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed: StoredSession = JSON.parse(raw);
      // Basic validation of state structure
      if (parsed.state && typeof parsed.state.currentStep === 'number') {
        return parsed.state;
      }
      return null;
    } catch (error) {
      console.error("Storage load failed:", error);
      return null;
    }
  },

  /**
   * Clears the current session.
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Exports the current session as a JSON file.
   */
  export(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      alert("No data found to export.");
      return;
    }

    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    a.href = url;
    a.download = `linkedin-post-draft-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Imports a session from a JSON file.
   */
  async import(file: File): Promise<AppState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed: StoredSession = JSON.parse(content);
          
          if (parsed.state && typeof parsed.state.currentStep === 'number') {
            this.save(parsed.state); // Persist immediately after valid import
            resolve(parsed.state);
          } else {
            throw new Error("Invalid session file format.");
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsText(file);
    });
  },

  /**
   * Debounced save for auto-saving state.
   */
  saveWithDebounce: debounce((state: AppState) => {
    storage.save(state);
    console.log("Auto-saved session...");
  }, 1000)
};
