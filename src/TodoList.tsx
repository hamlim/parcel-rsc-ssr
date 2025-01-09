import { TodoItem } from "./TodoItem";
import { getTodos } from "./actions";

export async function TodoList({ id }: { id: number | undefined }) {
  let todos = await getTodos();
  return (
    <ul className="list-none p-0 pr-32 border-r border-gray-500">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} isSelected={todo.id === id} />
      ))}
    </ul>
  );
}
