/**
 * Audio manager for game sounds
 */

class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.soundEnabled = true;
        this.soundTypes = {
            paddle: { baseFreq: 220, notes: [0, 5, 7], duration: 300 },
            wall: { baseFreq: 196, notes: [0, 4], duration: 250 },
            score: { baseFreq: 330, notes: [0, 4, 7, 12], duration: 400 },
            win: { baseFreq: 262, notes: [0, 4, 7, 12, 16, 19, 24], duration: 800 }
        };
    }

    /**
     * Initialize audio context (must be called on user interaction)
     */
    initAudioContext() {
        if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API not supported');
                this.soundEnabled = false;
            }
        } else if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    /**
     * Set sound enabled state
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    /**
     * Play a game sound effect
     */
    playSound(type) {
        // If sound is disabled, do nothing
        if (!this.soundEnabled) return;
        
        // Make sure the audio context is initialized and resumed
        this.initAudioContext();
        
        // If audio context failed to initialize or is in wrong state, exit
        if (!this.audioCtx || this.audioCtx.state !== 'running') {
            return;
        }
        
        try {
            // Different sound types for different game events
            switch(type) {
                case 'paddle':
                    this.playCalmSound(this.soundTypes.paddle);
                    break;
                    
                case 'wall':
                    this.playCalmSound(this.soundTypes.wall);
                    break;
                    
                case 'score':
                    this.playCalmSound(this.soundTypes.score);
                    break;
                    
                case 'win':
                    // Create a more complex winning arpeggio
                    this.playWinSound(this.soundTypes.win);
                    break;
            }
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    /**
     * Play a gentle, ambient note
     */
    playCalmSound(settings) {
        const { baseFreq, notes, duration } = settings;
        
        // Create a master gain node for overall volume control
        const masterGain = this.audioCtx.createGain();
        masterGain.gain.value = 0.2; // Lower overall volume
        masterGain.connect(this.audioCtx.destination);
        
        // Play each note in the chord with slight delay
        notes.forEach((semitones, index) => {
            // Calculate frequency using the musical scale (A4 = 440Hz)
            const freq = baseFreq * Math.pow(2, semitones / 12);
            
            setTimeout(() => {
                // Create oscillator
                const osc = this.audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                // Create individual gain for fade in/out
                const gainNode = this.audioCtx.createGain();
                
                // Connect
                osc.connect(gainNode);
                gainNode.connect(masterGain);
                
                // Gentle fade in
                gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.1);
                
                // Gentle fade out
                gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime + (duration / 1000) - 0.2);
                gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + (duration / 1000));
                
                // Start and stop
                osc.start();
                osc.stop(this.audioCtx.currentTime + (duration / 1000));
            }, index * 70); // Slight delay between notes for arpeggio effect
        });
    }

    /**
     * Special function for win sound with more complexity
     */
    playWinSound(settings) {
        const { baseFreq, notes, duration } = settings;
        
        // Create a master gain node
        const masterGain = this.audioCtx.createGain();
        masterGain.gain.value = 0.2; // Lower overall volume
        masterGain.connect(this.audioCtx.destination);
        
        // Add reverb-like effect with delay
        const delay = this.audioCtx.createDelay();
        delay.delayTime.value = 0.3;
        
        const feedback = this.audioCtx.createGain();
        feedback.gain.value = 0.3;
        
        // Connect delay network
        masterGain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(this.audioCtx.destination);
        
        // Play ascending arpeggio
        notes.forEach((semitones, index) => {
            const freq = baseFreq * Math.pow(2, semitones / 12);
            
            setTimeout(() => {
                // Create oscillator and gain for envelope
                const osc = this.audioCtx.createOscillator();
                osc.type = index % 2 === 0 ? 'sine' : 'triangle'; // Alternate waveforms
                osc.frequency.value = freq;
                
                const gainNode = this.audioCtx.createGain();
                
                // Connect
                osc.connect(gainNode);
                gainNode.connect(masterGain);
                
                // Gentle fade in
                gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.1);
                
                // Gentle fade out
                gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime + (duration / 1000) - 0.3);
                gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + (duration / 1000));
                
                // Start and stop
                osc.start();
                osc.stop(this.audioCtx.currentTime + (duration / 1000));
            }, index * 120); // Longer delay for win sound
        });
    }
}

// Export a singleton instance
export const audioManager = new AudioManager(); 