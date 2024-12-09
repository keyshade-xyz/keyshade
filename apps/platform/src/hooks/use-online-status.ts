import { useEffect } from "react"
import { toast } from "sonner";

const statusHandler = () => {
    if (navigator.onLine) {
        toast.success("You are back online! Refreshing...");
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else {
        toast.error("You are offline");
    }
};

export const useOnlineStatus = () => {
    useEffect(() => {
        window.addEventListener("online", statusHandler);
        window.addEventListener("offline", statusHandler);

        return () => {
            window.removeEventListener("online", statusHandler);
            window.removeEventListener("offline", statusHandler);
        }
    }, []);
}