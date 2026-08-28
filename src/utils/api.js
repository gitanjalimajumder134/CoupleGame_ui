export const API_BASE_URL = 'https://5wyzsvcjce.execute-api.ap-south-1.amazonaws.com/Prod';

export const fetchUserBalance = async (userId) => {
  if (!userId) return 500; // Default fallback
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data.coins !== undefined ? data.coins : 500;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 500;
  }
};

export const updateUserBalance = async (userId, amount) => {
  if (!userId) return 500;
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    const data = await res.json();
    return data.coins !== undefined ? data.coins : 500;
  } catch (error) {
    console.error('Error updating balance:', error);
    return 500;
  }
};
