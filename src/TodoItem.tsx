"use client";

import { startTransition, useOptimistic } from "react";
import { type Todo as ITodo, deleteTodo, setTodoComplete } from "./actions";

export function TodoItem({
  todo,
  isSelected,
}: { todo: ITodo; isSelected: boolean }) {
  let [isOptimisticComplete, setOptimisticComplete] = useOptimistic(
    todo.isComplete,
  );

  return (
    <li
      data-selected={isSelected || undefined}
      className="flex gap-8 p-8 rounded-md accent-color-[light-dark(black, white)] &[data-selected]:bg-[light-dark(#222, #ddd)] &[data-selected]:text-[light-dark(#ddd, #222)]"
    >
      <input
        type="checkbox"
        checked={isOptimisticComplete}
        onChange={(e) => {
          startTransition(async () => {
            setOptimisticComplete(e.target.checked);
            await setTodoComplete(todo.id, e.target.checked);
          });
        }}
      />
      <a
        href={`/todos/${todo.id}`}
        aria-current={isSelected ? "page" : undefined}
        className="text-inherit text-decoration-none w-full"
      >
        {todo.title}
      </a>
      <button type="submit" onClick={() => deleteTodo(todo.id)}>
        x
      </button>
    </li>
  );
}
