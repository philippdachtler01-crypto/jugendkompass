// Spotify-ähnlicher Audio Player
class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.volume = 0.7;
        this.playbackSpeed = 1.0;
        
        // Beispiel-Daten
        this.tracks = [
            {
                id: 1,
                title: 'Morgenandacht',
                artist: 'Jugendkompass Team',
                duration: 180,
                src: 'assets/audio/morgenandacht.mp3',
                cover: '🎧',
                category: 'devotional'
            },
            {
                id: 2,
                title: 'Psalm 23',
                artist: 'Bibel Hörbuch',
                duration: 240,
                src: 'assets/audio/psalm23.mp3',
                cover: '📖',
                category: 'bible'
            },
            {
                id: 3,
                title: 'Worship Mix',
                artist: 'Junge Gemeinde',
                duration: 3600,
                src: 'assets/audio/worship.mp3',
                cover: '🎵',
                category: 'music'
            },
            {
                id: 4,
                title: 'Meditation',
                artist: 'Frieden finden',
                duration: 300,
                src: 'assets/audio/meditation.mp3',
                cover: '🧘',
                category: 'meditation'
            },
            {
                id: 5,
                title: 'Jugend Podcast',
                artist: 'Glaube & Leben',
                duration: 1800,
                src: 'assets/audio/podcast.mp3',
                cover: '🎙️',
                category: 'podcast'
            }
        ];
        
        this.playlists = [
            {
                id: 'morning',
                title: 'Morgenroutine',
                count: 3,
                icon: '☀️'
            },
            {
                id: 'worship',
                title: 'Worship',
                count: 5,
                icon: '🎵'
            },
            {
                id: 'devotional',
                title: 'Kurzandachten',
                count: 7,
                icon: '🙏'
            },
            {
                id: 'bible',
                title: 'Bibel Hörbuch',
                count: 12,
                icon: '📖'
            }
        ];
        
        this.init();
    }

    init() {
        // Audio Event Listener
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // UI Event Listener
        document.getElementById('mini-play-btn')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('close-player-btn')?.addEventListener('click', () => this.closeFullPlayer());
        document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.prevTrack());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextTrack());
        document.getElementById('mini-close-btn')?.addEventListener('click', () => this.stop());
        
        // Progress Bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seek(e));
        }
        
        // Audio-Liste rendern
        this.renderAudioList();
        this.renderPlaylists();
        
        // Standard-Lautstärke
        this.audio.volume = this.volume;
    }

    renderAudioList() {
        const container = document.getElementById('recent-audio');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.tracks.slice(0, 3).forEach(track => {
            const item = document.createElement('div');
            item.className = 'audio-item';
            item.dataset.id = track.id;
            item.innerHTML = `
                <div class="audio-item-art">${track.cover}</div>
                <div class="audio-item-info">
                    <div class="audio-item-title">${track.title}</div>
                    <div class="audio-item-duration">${this.formatTime(track.duration)}</div>
                </div>
                <button class="play-btn" data-id="${track.id}">▶️</button>
            `;
            
            container.appendChild(item);
            
            // Event Listener für Play Button
            item.querySelector('.play-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.playTrack(track);
            });
            
            // Event Listener für gesamtes Item
            item.addEventListener('click', () => {
                this.showTrackDetails(track);
            });
        });
    }

    renderPlaylists() {
        const container = document.getElementById('playlists');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.playlists.forEach(playlist => {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.dataset.id = playlist.id;
            card.innerHTML = `
                <div class="playlist-icon">${playlist.icon}</div>
                <div class="playlist-title">${playlist.title}</div>
                <div class="playlist-count">${playlist.count} Titel</div>
            `;
            
            card.addEventListener('click', () => {
                this.showPlaylist(playlist.id);
            });
            
            container.appendChild(card);
        });
    }

    playTrack(track) {
        this.currentTrack = track;
        this.isPlaying = true;
        
        // Update UI
        this.updateMiniPlayer();
        this.updateFullPlayer();
        
        // Zeige Mini Player
        document.getElementById('mini-player').classList.remove('hidden');
        
        // Simuliere Audio-Playback (da keine echten Dateien)
        this.simulatePlayback();
        
        // Haptic Feedback
        if (window.Jugendkompass) {
            window.Jugendkompass.hapticFeedback();
        }
    }

    simulatePlayback() {
        // Simuliere Playback-Progress
        let progress = 0;
        const duration = this.currentTrack.duration;
        
        const update = () => {
            if (this.isPlaying && progress < duration) {
                progress += 1;
                this.updateProgress(progress, duration);
                setTimeout(update, 1000);
            }
        };
        
        update();
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            // Starte Playback
            this.updatePlayButton(true);
        } else {
            // Pausiere Playback
            this.updatePlayButton(false);
        }
        
        // Haptic Feedback
        if (window.Jugendkompass) {
            window.Jugendkompass.hapticFeedback();
        }
    }

    stop() {
        this.isPlaying = false;
        this.currentTrack = null;
        document.getElementById('mini-player').classList.add('hidden');
        document.getElementById('full-player').classList.add('hidden');
        this.updatePlayButton(false);
    }

    prevTrack() {
        if (!this.currentTrack) return;
        
        const currentIndex = this.tracks.findIndex(t => t.id === this.currentTrack.id);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : this.tracks.length - 1;
        
        this.playTrack(this.tracks[prevIndex]);
    }

    nextTrack() {
        if (!this.currentTrack) return;
        
        const currentIndex = this.tracks.findIndex(t => t.id === this.currentTrack.id);
        const nextIndex = currentIndex < this.tracks.length - 1 ? currentIndex + 1 : 0;
        
        this.playTrack(this.tracks[nextIndex]);
    }

    updateProgress(current, duration) {
        const progress = current / duration * 100;
        
        // Mini Player
        document.querySelector('.mini-progress').style.width = `${progress}%`;
        
        // Full Player
        document.getElementById('progress').style.width = `${progress}%`;
        document.querySelector('.progress-handle').style.left = `${progress}%`;
        
        // Zeit-Anzeige
        if (current && duration) {
            document.getElementById('current-time').textContent = this.formatTime(current);
            document.getElementById('duration').textContent = this.formatTime(duration);
        }
    }

    updateDuration() {
        const duration = this.audio.duration;
        document.getElementById('duration').textContent = this.formatTime(duration);
    }

    updateMiniPlayer() {
        if (!this.currentTrack) return;
        
        document.querySelector('.mini-track-title').textContent = this.currentTrack.title;
        document.querySelector('.mini-track-artist').textContent = this.currentTrack.artist;
        document.querySelector('.mini-album-art').style.background = `linear-gradient(135deg, var(--jk-primary), var(--jk-secondary))`;
        document.querySelector('.mini-album-art').textContent = this.currentTrack.cover;
        
        this.updatePlayButton(this.isPlaying);
    }

    updateFullPlayer() {
        if (!this.currentTrack) return;
        
        document.getElementById('full-track-title').textContent = this.currentTrack.title;
        document.getElementById('full-track-artist').textContent = this.currentTrack.artist;
        document.querySelector('.album-art-large').style.background = `linear-gradient(135deg, var(--jk-primary), var(--jk-secondary))`;
        document.querySelector('.album-art-large').textContent = this.currentTrack.cover;
        
        this.updatePlayButton(this.isPlaying);
    }

    updatePlayButton(playing) {
        const playIcon = playing ? '⏸️' : '▶️';
        document.getElementById('mini-play-btn').textContent = playIcon;
        document.getElementById('play-pause-btn').textContent = playIcon;
    }

    showFullPlayer() {
        document.getElementById('full-player').classList.remove('hidden');
    }

    closeFullPlayer() {
        document.getElementById('full-player').classList.add('hidden');
    }

    showTrackDetails(track) {
        this.currentTrack = track;
        this.updateFullPlayer();
        this.showFullPlayer();
    }

    showPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // Zeige Modal mit Playlist-Inhalten
        const modal = document.createElement('div');
        modal.className = 'ios-modal';
        modal.innerHTML = `
            <div class="ios-modal-content">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px">
                    <div style="font-size: 32px">${playlist.icon}</div>
                    <div>
                        <h2 style="margin: 0">${playlist.title}</h2>
                        <p style="color: var(--ios-text-secondary); margin: 4px 0 0 0">
                            ${playlist.count} Titel
                        </p>
                    </div>
                </div>
                <div class="audio-list" style="margin-bottom: 20px">
                    ${this.tracks.slice(0, playlist.count).map(track => `
                        <div class="audio-item" style="margin-bottom: 8px">
                            <div class="audio-item-art">${track.cover}</div>
                            <div class="audio-item-info">
                                <div class="audio-item-title">${track.title}</div>
                                <div class="audio-item-duration">${this.formatTime(track.duration)}</div>
                            </div>
                            <button class="play-btn" data-id="${track.id}">▶️</button>
                        </div>
                    `).join('')}
                </div>
                <button class="ios-button-primary" id="close-playlist" style="width: 100%">
                    Schließen
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event Listener für Play Buttons in der Playlist
        modal.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const trackId = parseInt(e.currentTarget.dataset.id);
                const track = this.tracks.find(t => t.id === trackId);
                if (track) {
                    this.playTrack(track);
                    modal.remove();
                }
            });
        });
        
        document.getElementById('close-playlist').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    seek(event) {
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        const percentage = x / width;
        
        if (this.currentTrack) {
            const newTime = percentage * this.currentTrack.duration;
            this.updateProgress(newTime, this.currentTrack.duration);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Download für Offline-Nutzung
    downloadTrack(track) {
        // In einer echten Implementierung würde hier der Download starten
        if (window.Jugendkompass) {
            window.Jugendkompass.showAlert(`Lade "${track.title}" für Offline-Nutzung herunter...`);
        }
        
        // Simuliere Download
        setTimeout(() => {
            const downloads = JSON.parse(localStorage.getItem('jk_downloads') || '[]');
            if (!downloads.find(d => d.id === track.id)) {
                downloads.push(track);
                localStorage.setItem('jk_downloads', JSON.stringify(downloads));
                
                if (window.Jugendkompass) {
                    window.Jugendkompass.showAlert('Download abgeschlossen! Verfügbar offline.');
                }
            }
        }, 2000);
    }
}

// Automatisch initialisieren
document.addEventListener('DOMContentLoaded', () => {
    window.AudioPlayer = new AudioPlayer();
    
    // Event Listener für Mini Player Klick
    document.getElementById('mini-player')?.addEventListener('click', () => {
        if (window.AudioPlayer.currentTrack) {
            window.AudioPlayer.showFullPlayer();
        }
    });
});
