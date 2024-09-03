# TaskManagement Dapp

This is a task management application powered by Cartesi Rollups. It allows users to add tasks, mark them as complete, and list their tasks in a decentralized environment.

## Installation Instructions

Follow the [Cartesi Rollups installation guide](https://docs.cartesi.io/cartesi-rollups/1.3/development/installation/)

## Compiling and Running Instructions

1. Clone the repository
2. Run `cd tasktesi`
3. Run `cartesi build`
4. Run `cartesi run`
5. Run `cartesi send` on a new terminal tab to send inputs to the application

## Usage

Send advance requests with payloads in the following formats:

### Add a Task

```json
{
  "action": "add",
  "task": "Complete project documentation"
}
```

### Mark a Task as Complete

```json
{
  "action": "complete",
  "task": "Complete project documentation"
}
```

## Inspecting State

To list all tasks for a user, use the route "list".
