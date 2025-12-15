/**
 * Clipboard helper functions for developer console use
 */

/**
 * Copy top 25 season players to clipboard in WhatsApp format
 * Usage in console: 
 *   copySeasonTop25()           // With place numbers/medals
 *   copySeasonTop25(false)      // With dashes instead
 */
export function copySeasonTop25(showPlace = true) {
  // Get the season players from the DOM or state
  const playerRows = document.querySelectorAll('.ranking-table tbody tr');
  
  if (playerRows.length === 0) {
    console.error('❌ No players found. Make sure you are on the season ranking view.');
    return;
  }
  
  const players = [];
  const maxPlayers = Math.min(25, playerRows.length);
  
  for (let i = 0; i < maxPlayers; i++) {
    const row = playerRows[i];
    const nameCell = row.querySelector('td:nth-child(2)'); // Name is usually 2nd column (after place)
    
    if (nameCell) {
      const name = nameCell.textContent.trim();
      players.push(name);
    }
  }
  
  if (players.length === 0) {
    console.error('❌ Could not extract player names from the table.');
    return;
  }
  
  // Format for WhatsApp with medal emojis for top 3
  let whatsappText = '🏆 *Top 25 Season Ranking* 🏆\n\n';
  
  players.forEach((name, index) => {
    const position = index + 1;
    let prefix = '';
    
    if (showPlace) {
      if (position === 1) prefix = '🥇';
      else if (position === 2) prefix = '🥈';
      else if (position === 3) prefix = '🥉';
      else prefix = `${position}.`;
    } else {
      prefix = '-';
    }
    
    whatsappText += `${prefix} ${name}\n`;
  });
  
  whatsappText += `\n_Generated on ${new Date().toLocaleDateString()}_`;
  
  // Copy to clipboard using fallback method (more reliable from console)
  const copyUsingFallback = () => {
    const textarea = document.createElement('textarea');
    textarea.value = whatsappText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        console.log('✅ Top 25 players copied to clipboard!');
        console.log('\nPreview:');
        console.log(whatsappText);
        return true;
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      document.body.removeChild(textarea);
      console.error('❌ Failed to copy to clipboard:', err);
      console.log('\nText to copy manually:');
      console.log(whatsappText);
      return false;
    }
  };
  
  // Try modern clipboard API first (with focus), fallback to execCommand
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // Try to focus the window first
    window.focus();
    
    navigator.clipboard.writeText(whatsappText)
      .then(() => {
        console.log('✅ Top 25 players copied to clipboard!');
        console.log('\nPreview:');
        console.log(whatsappText);
      })
      .catch(() => {
        // If modern API fails (e.g., no focus), use fallback
        copyUsingFallback();
      });
  } else {
    // Use fallback for older browsers
    copyUsingFallback();
  }
}

/**
 * Copy custom range of players to clipboard
 * Usage in console: 
 *   copySeasonPlayers(1, 20)          // Top 20 with place numbers
 *   copySeasonPlayers(1, 20, false)   // Top 20 with dashes
 */
export function copySeasonPlayers(start = 1, end = 25, showPlace = true) {
  const playerRows = document.querySelectorAll('.ranking-table tbody tr');
  
  if (playerRows.length === 0) {
    console.error('❌ No players found. Make sure you are on the season ranking view.');
    return;
  }
  
  const players = [];
  const startIdx = Math.max(0, start - 1);
  const endIdx = Math.min(end, playerRows.length);
  
  for (let i = startIdx; i < endIdx; i++) {
    const row = playerRows[i];
    const nameCell = row.querySelector('td:nth-child(2)');
    
    if (nameCell) {
      const name = nameCell.textContent.trim();
      players.push(name);
    }
  }
  
  if (players.length === 0) {
    console.error('❌ Could not extract player names from the table.');
    return;
  }
  
  // Format for WhatsApp
  let whatsappText = `🏆 *Season Ranking ${start}-${start + players.length - 1}* 🏆\n\n`;
  
  players.forEach((name, index) => {
    const position = start + index;
    let prefix = '';
    
    if (showPlace) {
      if (position === 1) prefix = '🥇';
      else if (position === 2) prefix = '🥈';
      else if (position === 3) prefix = '🥉';
      else prefix = `${position}.`;
    } else {
      prefix = '-';
    }
    
    whatsappText += `${prefix} ${name}\n`;
  });
  
  whatsappText += `\n_Generated on ${new Date().toLocaleDateString()}_`;
  
  // Copy to clipboard using fallback method (more reliable from console)
  const copyUsingFallback = () => {
    const textarea = document.createElement('textarea');
    textarea.value = whatsappText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        console.log(`✅ Players ${start}-${start + players.length - 1} copied to clipboard!`);
        console.log('\nPreview:');
        console.log(whatsappText);
        return true;
      } else {
        throw new Error('Copy command failed');
      }
    } catch (err) {
      document.body.removeChild(textarea);
      console.error('❌ Failed to copy to clipboard:', err);
      console.log('\nText to copy manually:');
      console.log(whatsappText);
      return false;
    }
  };
  
  // Try modern clipboard API first (with focus), fallback to execCommand
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // Try to focus the window first
    window.focus();
    
    navigator.clipboard.writeText(whatsappText)
      .then(() => {
        console.log(`✅ Players ${start}-${start + players.length - 1} copied to clipboard!`);
        console.log('\nPreview:');
        console.log(whatsappText);
      })
      .catch(() => {
        // If modern API fails (e.g., no focus), use fallback
        copyUsingFallback();
      });
  } else {
    // Use fallback for older browsers
    copyUsingFallback();
  }
}

// Instructions for console
export function showClipboardHelp() {
  console.log(`
📋 *Clipboard Helper Functions*

Available commands:
- copySeasonTop25()              Copy top 25 with place numbers/medals
- copySeasonTop25(false)         Copy top 25 with dashes instead
- copySeasonPlayers(1, 20)       Copy custom range (e.g., top 20)
- copySeasonPlayers(1, 20, false) Copy with dashes instead of numbers
- showClipboardHelp()            Show this help message

Example usage:

> copySeasonTop25()
✅ Top 25 players copied to clipboard!
🥇 Player 1
🥈 Player 2
🥉 Player 3
4. Player 4
...

> copySeasonTop25(false)
✅ Top 25 players copied to clipboard!
- Player 1
- Player 2
- Player 3
...

> copySeasonPlayers(1, 20, false)
✅ Players 1-20 copied to clipboard!
- Player 1
- Player 2
...

Make sure you're on the Season view before using these commands!
  `);
}

