"use server-entry";

import "./client";
// import "./Todos.css";
import "./app.css";
import { Dialog } from "./Dialog";
import { TodoCreate } from "./TodoCreate";
import { TodoDetail } from "./TodoDetail";
import { TodoList } from "./TodoList";

export async function Todos({ id }: { id?: number }) {
  return (
    <html lang="en" style={{ colorScheme: "dark light" }}>
      <head>
        <title>Hello World!</title>
      </head>
      <body className="font-family-system-ui">
        <header className="flex items-center justify-between max-w-250px p-8 pr-40 box-border">
          <h1>Hello World!</h1>
          <Dialog trigger="+">
            <h2>Add todo</h2>
            <TodoCreate />
          </Dialog>
        </header>
        <main className="flex gap-32">
          <div className="todo-column w-250px">
            <TodoList id={id} />
          </div>
          {id != null ? <TodoDetail key={id} id={id} /> : <p>Select a todo</p>}
        </main>
      </body>
    </html>
  );
}
