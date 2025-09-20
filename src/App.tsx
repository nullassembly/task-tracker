import { useState } from "react";
import "./App.css";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Frown, Loader2Icon, Plus, SquarePen, Unplug, X } from "lucide-react";
import type { Task } from "./types/types";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";
import { Input } from "./components/ui/input";
import { client } from "./lib/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { useTask } from "./AppContext";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { AddTaskSchema, updateFormSchema } from "./lib/schemas";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Checkbox } from "./components/ui/checkbox";
// add batch operations
function App() {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const ctx = useTask();
  const form = useForm<z.infer<typeof AddTaskSchema>>({
    resolver: zodResolver(AddTaskSchema),
    defaultValues: {
      task: "",
    },
  });
  const handleAddTask = async (values: z.infer<typeof AddTaskSchema>) => {
    try {
      const res = await client.post("/add", values);
      ctx.setTasks((prev) => [res.data, ...prev!]);
      setDialogOpen(false);
      toast.success("Task added successfully!");
      form.resetField("task");
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.detail);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col justify-center gap-8 mt-16">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl text-gray-700 font-semibold">Task Manager</h1>
        <p className="tracking-wide text-gray-500 text-sm">
          Small app to create or manage your daily tasks
        </p>
      </div>
      <div className="flex gap-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              Add Task <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div>
              <Form {...form}>
                <form
                  className="flex flex-col"
                  onSubmit={form.handleSubmit(handleAddTask)}
                >
                  <div className="grid gap-6">
                    <FormField
                      name="task"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-4">
                          <FormLabel>Task:</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Example: Go for a walk..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant={"outline"}>Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Add Task!</Button>
                    </DialogFooter>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
        <BatchDeleteDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Edit</TableHead>
            <TableHead>Delete</TableHead>
            <TableHead>Check</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ctx.tasks?.length !== 0 && (
            <>
              {ctx.tasks?.map((task, index) => (
                <Row key={index} task={task} />
              ))}
            </>
          )}
        </TableBody>
        {ctx.tasks?.length !== 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="text-right" colSpan={3}>
                Total
              </TableCell>
              <TableCell className="text-right">{ctx.tasks?.length}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
      <div className="flex flex-col gap-4 text-gray-500 items-center">
        {ctx.loading == "fail" && (
          <>
            <Unplug size={96} />
            <p>Could not connect to server.</p>
            <Button
              variant={"link"}
              className="text-md font-semibold cursor-pointer"
              onClick={() => {
                ctx.fetchTasks();
              }}
            >
              Try again
            </Button>
          </>
        )}
        {ctx.loading === "loading" && (
          <>
            <Loader2Icon size={80} className="animate-spin text-gray-300" />
            <p>Loading Tasks...</p>
          </>
        )}
        {ctx.loading === "loaded" && (
          <>
            {ctx.tasks?.length == 0 && (
              <>
                <Frown size={96} />
                <p className="text-xl">No tasks to show</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

type RowProps = {
  task: Task;
};
const Row = ({ task }: RowProps) => {
  const ctx = useTask();
  const handleCheckboxClick = () => {
    ctx.setTasksChecked((prev) => {
      const set = new Set(prev);
      if (set.has(task.id.toString())) {
        set.delete(task.id.toString());
      } else {
        set.add(task.id.toString());
      }
      return set;
    });
  };
  return (
    <TableRow>
      <TableCell>{task.task}</TableCell>
      <TableCell className="text-left">
        {task.completed ? "Completed" : "Not Completed"}
      </TableCell>
      <TableCell className="w-[100px]">
        <UpdateDialog task={task} />
      </TableCell>
      <TableCell className="w-[100px]">
        <DeleteDialog id={task.id} />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={ctx.tasksChecked.has(task.id.toString())}
          onCheckedChange={handleCheckboxClick}
        />
      </TableCell>
    </TableRow>
  );
};

const DeleteDialog = ({ id }: { id: number }) => {
  const [open, setOpen] = useState<boolean>(false);
  const ctx = useTask();
  const handleDelete = async () => {
    try {
      await client.delete(`/delete/${id}`);
      ctx.setTasks((prev) => {
        let updatedTasks = [...prev!];
        updatedTasks = updatedTasks.filter((task) => task.id !== id);
        return updatedTasks;
      });
      setOpen(false);
      toast.success("Task Deleted!");
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.detail);
      }
    }
  };
  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <X strokeWidth={2.5} className="text-red-500" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you wanna delete this task? This action is irreversible
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant={"outline"}>Cancel</Button>
          </AlertDialogCancel>
          <Button variant={"destructive"} onClick={handleDelete}>
            Delete Task
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const BatchDeleteDialog = () => {
  const [open, setOpen] = useState<boolean>(false);
  const ctx = useTask();

  const handleBatchDelete = async () => {
    try {
      const res = await client.delete("batch/delete", {
        data: { ids: Array.from(ctx.tasksChecked) },
      });
      const newSet = new Set(res.data.ids);

      ctx.setTasks((prev) => {
        let updated = [...prev!];
        updated = updated.filter((t) => !newSet.has(t.id));
        return updated;
      });
      setOpen(false);
      ctx.setTasksChecked(new Set());
      toast.success(`${res.data.ids.length} Task(s) were deleted!`);
    } catch (error) {}
  };
  console.log(ctx.tasks);
  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button variant={"destructive"} disabled={ctx.tasksChecked.size === 0}>
          Batch Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batch Delete</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you wanna delete these {ctx.tasksChecked.size} task(s)?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant={"outline"}>Cancel</Button>
          </AlertDialogCancel>
          <Button variant={"destructive"} onClick={handleBatchDelete}>
            Delete Tasks!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
type UpdateDialogProps = {
  task: Task;
};
const UpdateDialog = ({ task }: UpdateDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const ctx = useTask();
  const form = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      task: task.task,
      completed: task.completed.toString(),
    },
  });
  const handleUpdateTask = async (values: z.infer<typeof updateFormSchema>) => {
    try {
      await client.patch(`update/${task.id}`, values);
      ctx.setTasks((prev) => {
        let updatedList = [...prev!];
        updatedList = updatedList.map((t) => {
          if (t.id == task.id) {
            return {
              ...t,
              task: values.task,
              completed: Number(values.completed),
            };
          }
          return t;
        });
        return updatedList;
      });
      setDialogOpen(false);
      toast.success("Task Updated!");
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.detail);
      }
    }
  };
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <SquarePen className="text-green-700" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <div>
          <Form {...form}>
            <form
              className="flex flex-col"
              onSubmit={form.handleSubmit(handleUpdateTask)}
            >
              <div className="grid gap-4">
                <FormField
                  name="task"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4">
                      <FormLabel>Task:</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Example: Go for a walk..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="completed"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4">
                      <FormLabel>Task:</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={task.completed.toString()}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selected Task status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="0">Not Completed</SelectItem>
                              <SelectItem value="1">Completed</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant={"outline"}>Cancel</Button>
                </DialogClose>
                <Button type="submit">Update Task!</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
