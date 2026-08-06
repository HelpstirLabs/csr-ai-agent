const API_BASE_URL = "https://helpstir.in/csr-api";
const API_HELPSTIR_URL = "http://127.0.0.1:8088";

export const handleProjectDesign = async (payload) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/project-generator/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                credentials:"include"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to generate project");
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Project generation error:", error);
        throw error;
    }
};

export const fetchNGOsData = async () => {
    try {
        const response = await fetch(
            `${API_HELPSTIR_URL}/project-generator/ngo-details`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(),
                credentials:"include"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch NGO's");
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Project generation error:", error);
        throw error;
    }
}