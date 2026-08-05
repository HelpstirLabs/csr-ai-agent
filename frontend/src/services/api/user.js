const API_BASE_URL = "https://helpstir.in/csr-api";

export const userRegister = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    return {
      status: response.status,
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Error during registration:", error);

    return {
      status: 500,
      success: false,
      message: "Network Error",
    };
  }
};

export const userOTPVerification = async (userId, otp) => {
  try {
    console.log("Sending OTP verification request for User ID:", userId, "with OTP:", otp);
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, otp }),
    });

    const data = await response.json();

    return {
      status: response.status,
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Error during OTP verification:", error);

    return {
      status: 500,
      success: false,
      message: "Network Error",
    };
  }
};

export const userOTPResend = async (userId) => {
  try {
    console.log("Sending OTP resend request for User ID:", userId);
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();

    return {
      status: response.status,
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Error during OTP resend:", error);
    return {
      status: 500,
      success: false,
      message: "Network Error",
    };
  }
};

export const handleProfileData = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
    });
    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return {
      status: 500,
      success: false,
      message: "Network Error",
    };
  }
};

export const saveProfileData = async (userId, profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
      credentials:"include"
    });
    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Error saving profile data:", error);
    return {
      status: 500,
      success: false,
      message: "Network Error",
    };
  } 
};