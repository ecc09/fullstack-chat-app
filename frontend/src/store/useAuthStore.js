import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";


export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({authUser: res.data });
            get().connectSocket()
            
        } catch (error) {
            console.log("error in checkAuth", error);
            set({authUser: null});
            
        } finally {
            set({isCheckingAuth: false});

        }
    },

    signup: async (data) => {
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({authUser: res.data});
            toast.success("Account Created Successfully");
            get().connectSocket()
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({isSigningUp: false});
        }
    },

    login: async (data) => {
        set({isLoggingIn: true});
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({authUser: res.data});
            toast.success("Logged in Successfully");
            get().connectSocket()
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({isLoggingIn: false});
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
            
        } catch (error) {
            console.log("error in update-profile ", error);
            toast.error(error.response.data.message);
            
        } finally {
            set({ isUpdatingProfile: false })
        }
       
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
            
        }
    },
    connectSocket: () => {
        const { authUser } = get();
        console.log("get().socket?.connected", get().socket?.connected)
        console.log("auth user:", authUser);
        if (!authUser || get().socket?.connected) {
            console.log("something went wrong!");
            return;
        }

        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id,
            }
        });
        socket.connect();

        

        socket.on("getOnlineUsers", (userIds) => {
            set({onlineUsers: userIds});
        })
        
        set({ socket: socket });
        console.log("socket: ", socket);

    },
    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();

    }, 
}));