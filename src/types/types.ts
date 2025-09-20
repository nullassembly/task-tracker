export type Task = {
  id: number;
  task: string;
  created: Date;
  completed: number;
};

export type LoadState =
  | "loading"
  | "loaded"
  | "fail"
  | "serverfail"
  | "serverloading";
