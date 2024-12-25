"use server-entry";

import "./client";
import "./Todos.css";
import { Resources } from "@parcel/runtime-rsc";
import { Dialog } from "./Dialog";
import { TodoCreate } from "./TodoCreate";
import { TodoDetail } from "./TodoDetail";
import { TodoList } from "./TodoList";

export async function Todos({ id }: { id?: number }) {
  return (
    <html lang="en" style={{ colorScheme: "dark light" }}>
      <head>
        <title>Hello World!</title>
        <Resources />
      </head>
      <body>
        <header>
          <h1>Hello World!</h1>
          <Dialog trigger="+">
            <h2>Add todo</h2>
            <TodoCreate />
          </Dialog>
        </header>
        <main>
          <div className="todo-column">
            <TodoList id={id} />
          </div>
          {id != null ? <TodoDetail key={id} id={id} /> : <p>Select a todo</p>}
        </main>
      </body>
    </html>
  );
}
