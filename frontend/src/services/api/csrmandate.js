const API_BASE_URL = "https://api-csr-ai-agent.onrender.com";

export const getCSRMandate = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/csr-mandate`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials:"include"
    }
    );
    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(
      "Error fetching CSR mandate:",
      error
    );

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        "Failed to fetch CSR mandate",
    };
  }
};

export const saveCSRMandate = async (
  userId,
  payload
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/csr-mandate`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials:"include"
      }
    );
    const data = await response.json();

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Error saving CSR mandate:",
      error
    );

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        "Failed to save CSR mandate",
    };
  }
};

export const saveProfileGoal = async (
  userId,
  payload
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/csr-goals`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials:"include"
      }
    );

    const data = await response.json();
    return {
      success:true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Error saving CSR Goals:",
      error
    );

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        "Failed to save CSR Goals",
    };
  }
};

export const fetchCSRGoalsData = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/csr-goals`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials:"include"
    }
    );
    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error(
      "Error fetching CSR goals:",
      error
    );

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        "Failed to fetch CSR goals",
    };
  }
};