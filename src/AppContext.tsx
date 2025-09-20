import { createContext, useContext, useEffect, useState } from "react";
import type { Task, LoadState } from "./types/types";
import { client } from "./lib/client";
import Loader from "./Loader";

type TaskContextType = {
  tasks: Task[] | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[] | null>>;
  tasksChecked: Set<string>;
  setTasksChecked: React.Dispatch<React.SetStateAction<Set<string>>>;
  loading: LoadState;
  setLoading: React.Dispatch<React.SetStateAction<LoadState>>;
  fetchTasks: () => Promise<void>;
};
const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasksChecked, setTasksChecked] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState<LoadState>("serverloading");
  const [serverLoading, setServerLoading] = useState<boolean>(true);
  const fetchTasks = async () => {
    console.log("running fetchTasks function...");
    setLoading("loading");
    try {
      const res = await client.get("/tasks");
      setTasks(res.data.tasks);
      setLoading("loaded");
    } catch (error) {
      setLoading("fail");
    }
  };

  const waitForServer = async () => {
    console.log("waitForServer is running...");
    setLoading("serverloading");
    setServerLoading(true);
    let attempts = 0;
    while (attempts < 5) {
      try {
        await client.get("/ping", {
          timeout: 5000,
        });
        console.log("Server is up!");
        setServerLoading(false);
        return true;
      } catch (error) {
        console.log("Waiting for server to response: attempt: ", attempts);
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
      }
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const flag = await waitForServer();
      if (flag) {
        fetchTasks();
      } else {
        setLoading("serverfail");
      }
    };
    init();
  }, []);
  const initialState: TaskContextType = {
    tasks,
    setTasks,
    tasksChecked,
    setTasksChecked,
    loading,
    setLoading,
    fetchTasks,
  };
  if (serverLoading) return <Loader loading={loading} />;
  return (
    <TaskContext.Provider value={initialState}>{children}</TaskContext.Provider>
  );
};

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTask must used in TaskProvider's context!");
  return ctx;
};
