let audioContext: AudioContext | null = null;
let isCleanedUp = false;

export type SoundType = 'check_in' | 'check_out' | 'error' | 'recognition';

function playTone(frequency: number, duration: number, volume: number = 0.3) {
  // Don't play if cleanup has been called
  if (isCleanedUp) return;
  
  try {
    // Reuse AudioContext to avoid creating multiple instances
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume context if it's suspended (happens in some browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        // Ignore errors during resume
      });
    }

    // Check again after potential async operations
    if (isCleanedUp || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Wrap connections in try-catch to handle potential cleanup race conditions
    try {
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      // Clean up oscillator after it's done
      oscillator.onended = () => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
      };
    } catch (e) {
      // Ignore connection errors if audio context was closed
      if (!isCleanedUp) {
        console.debug('Audio connection error:', e);
      }
    }
  } catch (error) {
    // Only log if it's not an AbortError or DOMException
    if (error instanceof Error && 
        !error.message.includes('AbortError') && 
        !error.message.includes('The user aborted a request') &&
        !(error instanceof DOMException)) {
      console.warn('Failed to play sound:', error);
    }
  }
}

export function playSound(type: SoundType = 'check_in') {
  switch (type) {
    case 'check_in':
      // Two ascending tones for check-in (happy sound)
      playTone(600, 0.1, 0.3);
      setTimeout(() => playTone(800, 0.15, 0.3), 100);
      break;
      
    case 'check_out':
      // Two descending tones for check-out
      playTone(800, 0.1, 0.3);
      setTimeout(() => playTone(600, 0.15, 0.3), 100);
      break;
      
    case 'error':
      // Low tone for errors
      playTone(300, 0.2, 0.3);
      break;
      
    case 'recognition':
      // Quick double beep for QR code recognition
      playTone(700, 0.05, 0.25);
      setTimeout(() => playTone(700, 0.05, 0.25), 70);
      break;
      
    default:
      // Default beep
      playTone(800, 0.1, 0.3);
  }
}

// Backward compatibility
export function playBeep() {
  playSound('check_in');
}

export function cleanupAudio() {
  isCleanedUp = true;
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {
      // Ignore errors during cleanup
    });
    audioContext = null;
  }
}

// Reset the cleanup flag when needed (e.g., when navigating back to a page)
export function resetAudio() {
  isCleanedUp = false;
}