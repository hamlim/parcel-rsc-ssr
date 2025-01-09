import { createTodo } from "./actions";

export function TodoCreate() {
  return (
    <form
      action={createTodo}
      className="grid grid-cols-[auto_1fr] gap-8 max-w-250px"
    >
      <label className="contents">
        Title: <input name="title" />
      </label>
      <label className="contents">
        Description: <textarea name="description" />
      </label>
      <label className="contents">
        Due date: <input type="date" name="dueDate" />
      </label>
      <button type="submit">Add todo</button>
    </form>
  );
}
