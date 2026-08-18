/**
 * Formats question text by replacing "Player 1" and "Player 2" placeholders with actual player names.
 * Also removes surrounding quotation marks if they exist.
 * 
 * @param {string} text - The original question text from DynamoDB
 * @param {string} activePlayerName - The name of the player whose turn it is (Player 1 in context of the card action)
 * @param {string} inactivePlayerName - The name of the other player (Player 2 in context of the card action)
 * @returns {string} - The formatted text
 */
export const formatCardText = (text, activePlayerName, inactivePlayerName) => {
  if (!text) return '';

  let formatted = text;
  
  // Replace "Player 1" or 'Player 1' or Player 1
  formatted = formatted.replace(/['"]?Player 1['"]?/gi, activePlayerName);
  
  // Replace "Player 2" or 'Player 2' or Player 2
  formatted = formatted.replace(/['"]?Player 2['"]?/gi, inactivePlayerName);

  // Strip leading and trailing double quotes from the whole string if they exist
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.substring(1, formatted.length - 1);
  }

  return formatted;
};
