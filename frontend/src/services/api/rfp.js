const API_BASE_URL = "http://localhost:8088";

export const getRFPs = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/rfp/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });
        if (!response.ok) {
            throw new Error("Failed to fetch NGO's");
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error fetching RFPs:", error);
        throw error;
    }
};

export const getRFPDetails = async (projectId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rfp/${projectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });
        if (!response.ok) {
            throw new Error("Failed to fetch RFP details");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching RFP details:", error);
        throw error;
    }
};

export const getEOIDetails = async (projectId, ngoMatchId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rfp/eoi/${projectId}/${ngoMatchId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Failed to fetch RFP details"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching RFP details:", error);
    throw error;
  }
};

export const submitAccept = async (ngoMatchId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rfp/eoi/accept/${ngoMatchId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || data.message || "Failed to accept EOI"
      );
    }

    return data;
  } catch (error) {
    console.error("Error accepting EOI:", error);
    throw error;
  }
};

export const submitDecline = async (ngoMatchId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rfp/eoi/decline/${ngoMatchId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || data.message || "Failed to decline EOI"
      );
    }

    return data;
  } catch (error) {
    console.error("Error declining EOI:", error);
    throw error;
  }
};