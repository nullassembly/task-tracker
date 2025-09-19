import { createContext, useContext, useEffect, useState } from "react";
import type { Task } from "./types/types";
import { client } from "./lib/client";

type TaskContextType = {
  tasks: Task[] | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[] | null>>;
  tasksChecked: Set<string>;
  setTasksChecked: React.Dispatch<React.SetStateAction<Set<string>>>;
};
const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasksChecked, setTasksChecked] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const initialState: TaskContextType = {
    tasks,
    setTasks,
    tasksChecked,
    setTasksChecked,
  };
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await client.get("http://127.0.0.1:8000/tasks");
        setTasks(res.data.tasks);
      } catch (error) {
        console.error("App.tsx:", error);
      }
    };
    fetchTasks();
  }, []);
  return (
    <TaskContext.Provider value={initialState}>{children}</TaskContext.Provider>
  );
};

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTask must used in TaskProvider's context!");
  return ctx;
};
