# SummerJob Planner (Python)

This is the new planning component of the SummerJob application. It listens for messages from a RabbitMQ queue, fetches data from the database, generates a plan, and stores the results back in the database.

## 🛠 How it works

1. The app connects to a RabbitMQ queue using the `pika` library.
2. It waits for messages in the format `{"planId": "<uuid>"}`.
3. On receiving a message, it fetches required data from the database.
4. The plan is calculated using custom logic defined in `solver.py`.
5. Results are saved back to the database.