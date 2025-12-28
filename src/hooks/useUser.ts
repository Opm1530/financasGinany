import { useAuth } from "@/contexts/AuthContext";

export const useUser = () => {
    const { user, isAllowed, loading } = useAuth();
    return { user, isAllowed, loading };
};
