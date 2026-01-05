//================================================================================
// LOCAL STORAGE
//
//================================================================================
// liked songs,----have to implement this  saveFavorites(),loadFavorites(),
//  recently played----have to implement this  saveRecentlyPlayed(),loadRecentlyPlayed(),
//  favorites,----have to implement this  saveFavorites(),loadFavorites(),
//  volume,----have to implement this  saveVolume(),loadVolume(),
//  shuffle,----have to implement this  saveShuffle(),loadShuffle(),
//  queue----have to implement this  saveQueue(),loadQueue(),
//================================================================================


// for checking status of local storage
const safeLocalStorage = {
    isAvailable(){
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            console.log('✅ LocalStorage is available');
            return true;  // Returns TRUE if localStorage works
        } catch (e) {
            console.log('❌ LocalStorage is not available', e.message);
            return false; // Returns FALSE if localStorage fails
        }
    },

    save(key, data){
        // Check if localStorage is NOT available
        if (!this.isAvailable()) {
            console.warn('⚠️ Cannot save - localStorage not working');
            return false; 
        }
        
        // If we reach here, localStorage IS available
        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem(key, jsonString);
            console.log(`✅ Saved "${key}":`, data);
            return true;
        } catch (error) {
            console.error(`❌ Error saving "${key}":`, error.message);
            return false;
        }
    },

    load(key,defaultValue=null){
        // Check if localStorage is NOT available
        if (!this.isAvailable()) {
            console.warn('⚠️ Cannot load - localStorage not working');
            return defaultValue; // Return default value if localStorage fails
        }
        
        // If we reach here, localStorage IS available
        try {
            const jsonString = localStorage.getItem(key);
            if (jsonString === null) {
                console.warn(`⚠️ No data found for "${key}", returning default value`);
                return defaultValue; // Return default value if key not found
            }
            const data = JSON.parse(jsonString);
            console.log(`✅ Loaded "${key}":`, data);
            return data;
        } catch (error) {
            console.error(`❌ Error loading "${key}":`, error.message);
            return defaultValue; // Return default value on error
        }
    },

    remove(key){
        if (!this.isAvailable()) {
            console.warn('⚠️ Cannot remove - localStorage not working');
            return false; // Return false if localStorage fails
        }
        try {
            localStorage.removeItem(key);
            console.log(`✅ Removed "${key}" from localStorage`);
            return true;
        } catch (error) {
            console.error(`❌ Error removing "${key}":`, error.message);
            return false; // Return false on error
        }
    }
};

//================================================================================================
//Now creating functions 

const musicStorage={
    saveFavorites(favoritesArray){
        return safeLocalStorage.save('whitehole-favorites', favoritesArray);
    },
    loadFavorites(){
        return safeLocalStorage.load('whitehole-favorites', []);
    },
    removeFavorites(){
        return safeLocalStorage.remove('whitehole-favorites');
    },
    saveVolume(volumeLevel){
        return safeLocalStorage.save('whitehole-volume', volumeLevel);
    },
    loadVolume(){
        return safeLocalStorage.load('whitehole-volume', 1); // Default volume is 1 (100%)
    },
    removeVolume(){
        return safeLocalStorage.remove('whitehole-volume');
    },
    saveShuffle(isShuffleEnabled){
        return safeLocalStorage.save('whitehole-shuffle', isShuffleEnabled);
    },
    loadShuffle(){
        return safeLocalStorage.load('whitehole-shuffle', false); // Default is shuffle disabled
    },
    removeShuffle(){
        return safeLocalStorage.remove('whitehole-shuffle');
    },
    saveQueue(queueArray){
        return safeLocalStorage.save('whitehole-queue', queueArray);
    },
    loadQueue(){
        return safeLocalStorage.load('whitehole-queue', []);
    },
    removeQueue(){
        return safeLocalStorage.remove('whitehole-queue');
    },
    saveRecentlyPlayed(recentlyPlayedArray){
        return safeLocalStorage.save('whitehole-recently-played', recentlyPlayedArray);
    },
    loadRecentlyPlayed(){
        return safeLocalStorage.load('whitehole-recently-played', []);
    },
    removeRecentlyPlayed(){
        return safeLocalStorage.remove('whitehole-recently-played');
    },
    
    // Add these missing methods:
    getFavorites() {
        return this.loadFavorites();
    },
    
    getRecentlyPlayed() {
        return this.loadRecentlyPlayed();
    },
    
    getQueue() {
        return this.loadQueue();
    },
    
    getVolume() {
        return this.loadVolume();
    },
    
    getShuffle() {
        return this.loadShuffle();
    }
}

//================================================================================================
// INITIALIZATION FUNCTIONS - Load all data when website starts
//================================================================================================

const storageInitializer={
    initializerAllData(){
        console.log('🔄 Loading all saved data...');
        if (!safeLocalStorage.isAvailable()) {
            console.warn('⚠️ localStorage not available - using default values');
            return this.getDefaultData();
        }

        // Load all data
        const loadedData = {
            favorites: musicStorage.loadFavorites(),
            volume: musicStorage.loadVolume(),
            shuffle: musicStorage.loadShuffle(),
            queue: musicStorage.loadQueue(),
            recentlyPlayed: musicStorage.loadRecentlyPlayed()
        };

        console.log('✅ All data loaded successfully:', loadedData);
        return loadedData;
    },

    // Get default data if localStorage fails
    getDefaultData() {
        return {
            favorites: [],
            volume: 0.5,        // 50% volume
            shuffle: false,     // Shuffle off
            queue: [],          // Empty queue
            recentlyPlayed: []  // No recent songs
        };
    },

    applyDataToPlayer(data) {
        console.log('🔄 Applying saved data to player...', data);
       // Apply volume to audio element
    if (data.volume !== undefined && typeof currentAudio !== 'undefined') {
        currentAudio.volume = data.volume;
        console.log(`🔊 Volume set to: ${Math.round(data.volume * 100)}%`);

        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = data.volume * 100;
        }
    }
    
    // Apply shuffle state
    if (data.shuffle !== undefined && typeof isShuffleEnabled !== 'undefined') {
        isShuffleEnabled = data.shuffle;
        console.log(`🔀 Shuffle set to: ${data.shuffle ? 'ON' : 'OFF'}`);
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            if (data.shuffle) {
                shuffleBtn.classList.add('active');
                shuffleBtn.style.color = '#8a2be2';
            } else {
                shuffleBtn.classList.remove('active');
                shuffleBtn.style.color = '';
            }
        }
    }
    
    // Apply favorites
    if (data.favorites && typeof favorites !== 'undefined') {
        // Clear existing favorites first
        favorites.length = 0;
        // Add restored favorites
        favorites.push(...data.favorites);
        console.log(`💝 ${data.favorites.length} favorites restored`);
        setTimeout(() => {
            if (typeof updateHeartButton === 'function' && currentPlayingSong) {
                updateHeartButton(currentPlayingSong);
            }
        }, 500);
    }
    
    // Apply queue
     if (data.queue && data.queue.length > 0 && typeof queue !== 'undefined') {
        // Clear existing queue first
        queue.length = 0;
        // Add restored queue
        queue.push(...data.queue);
        console.log(`🎵 Queue restored with ${data.queue.length} songs`);
        
        // Update queue display
        setTimeout(() => {
            if (typeof updateQueueDisplay === 'function') {
                updateQueueDisplay();
            }
        }, 100);
    }
    
    // Apply recently played
    if (data.recentlyPlayed && typeof recentlyPlayed !== 'undefined') {
        recentlyPlayed = data.recentlyPlayed;
        console.log(`🎵 Recently played restored with ${data.recentlyPlayed.length} songs`);
    }

        console.log('✅ Data applied to player successfully');
    }
    
};

//================================================================================================
// AUTO-INITIALIZATION 
//================================================================================================

function initializeWhiteholeStorage() {
    console.log('🎵 Starting WhiteHole initialization...');
    
    try {
       
        const savedData = storageInitializer.initializerAllData();
        
     
        storageInitializer.applyDataToPlayer(savedData);
        
      
        console.log('📊 Initialization Summary:');
        console.log(`💝 Favorites: ${savedData.favorites.length} songs`);
        console.log(`🔊 Volume: ${Math.round(savedData.volume * 100)}%`);
        console.log(`🔀 Shuffle: ${savedData.shuffle ? 'ON' : 'OFF'}`);
        console.log(`🎵 Queue: ${savedData.queue.length} songs`);
        console.log(`🕒 Recent: ${savedData.recentlyPlayed.length} songs`);
        console.log('✅ WhiteHole storage initialized successfully!');
        
        return savedData;
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        return null;
    }
}

// Auto-run when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded - Starting storage initialization...');
    
    
    setTimeout(function() {
        initializeWhiteholeStorage();
        window.whiteholeStorageInitialized = true;
    }, 1000); 
});


window.addEventListener('load', function() {
    if (!window.whiteholeStorageInitialized) {
        console.log('🔄 Running backup initialization...');
        initializeWhiteholeStorage();
        window.whiteholeStorageInitialized = true;
    }
});

//================================================================================================
// EXPORT FOR GLOBAL USE - Make available to other JavaScript files
//================================================================================================

// Make everything available globally
window.safeLocalStorage = safeLocalStorage;
window.musicStorage = musicStorage;
window.storageInitializer = storageInitializer;
window.initializeWhiteholeStorage = initializeWhiteholeStorage;

console.log('📦 WhiteHole localStorage system loaded and ready!');
console.log('🎯 Available functions:');
console.log('- musicStorage.saveFavorites(array)');
console.log('- musicStorage.saveVolume(level)');
console.log('- musicStorage.saveShuffle(boolean)');
console.log('- musicStorage.saveQueue(array)');
console.log('- Auto-initialization will run when page loads');