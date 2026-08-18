const MAX_HISTORY_LENGTH = 50;

/**
 * Appends a DareId to the user's used question history in LocalStorage.
 * Capped at MAX_HISTORY_LENGTH to represent a rolling window of recent matches.
 * 
 * @param {string} dareId - The ID of the question/dare that was just revealed.
 */
export const recordUsedQuestion = (dareId) => {
  if (!dareId) return;

  try {
    const localUserStr = localStorage.getItem('ignite_user');
    if (!localUserStr) return;

    const user = JSON.parse(localUserStr);
    let history = user.usedQuestionIds || [];

    // Don't duplicate if it was somehow just added
    if (history[history.length - 1] === dareId) {
      return;
    }

    history.push(dareId);

    // Enforce rolling window
    if (history.length > MAX_HISTORY_LENGTH) {
      history = history.slice(history.length - MAX_HISTORY_LENGTH);
    }

    user.usedQuestionIds = history;
    localStorage.setItem('ignite_user', JSON.stringify(user));
  } catch (err) {
    console.error("Failed to record used question:", err);
  }
};
