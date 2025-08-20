// For development on this machine use local backend (ensure backend running on port 5001)
import { Platform } from "react-native";

// On Android emulator use 10.0.2.2 to reach host machine
const localHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_URL = `http://${localHost}:5001/api`;

// For testing against the hosted backend use the line below (uncomment when needed)
// export const API_URL = "https://my-wallet-bl80.onrender.com/api";
