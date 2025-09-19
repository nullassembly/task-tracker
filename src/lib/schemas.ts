import z from "zod";

export const AddTaskSchema = z.object({
  task: z.string().min(1, { message: "Please enter your title" }),
});

export const updateFormSchema = z.object({
  task: z.string().min(1, { message: "Please Enter your task!" }),
  completed: z.string(),
});
