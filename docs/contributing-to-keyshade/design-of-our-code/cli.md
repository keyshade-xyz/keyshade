---
description: Design of our CLI
---

# CLI

The CLI is what you use to connect your applications to keyshade to utilize the configurations. Apart from that, you can also use the CLI to manage your configurations, workspace, and other things. In this document, we will cover how we have developed our CLI, talk about the infrastructure, and how you can start contributing to it.

## Stack

We have a very simple stack for our CLI:

- **NodeJS** as the base
- **Commander** as the CLI framework
- **Clack** for interactive prompts

## Structure

We are following the principles of OOP to design a clean and extendible CLI. The current architecture allows us to easily build upon the existing system to add new features.

### Folder structure

- **commands**: Contains the command files that are used by the CLI
- **utils**: Contains utility functions that are used across the CLI
- **types**: Contains the types that are used across the CLI
- **http**: Contains the HTTP client that is used to interact with the keyshade API

### The `BaseCommand` class

The `BaseCommand` class is the parent class for all the commands that are used by the CLI. It contains common methods that are used by all the commands. You can find it in `src/commands/base.command.ts`. The objects of the subclasses created are primarily tied up in the `COMMANDS` variable in `index.ts`.

#### Methods

It is an abstract class with only two abstract methods:

- `getName`: This method returns the name of the command
- `getDescription`: This method returns the description of the command

The rest of the commands are optional and can be overridden as per the requirement.

#### Creating a new command

Whenever you try to develop a command, you would need to take the following steps:

- Create a new file in the `commands` folder with this name: `<command-name>.command.ts`
- Create a new class in that file with this format: `export class <CommandName>Command extends BaseCommand`
- Implement the abstract methods `getName` and `getDescription` in the class
- Next up, decide on the other fields that you would like to override from the `BaseCommand` class. It is highly recommended to go through the `BaseCommand` class to understand the methods that you can override.
- If you think you will need to create any more subcommands, create a folder with the name of the command in the `commands` folder and follow the same steps as above. Once done, you would need to tie up those commands by overriding the `getSubCommands` function in the parent command.
- Once you have finished working on the commands, you would need to add the command to the `COMMANDS` variable in `index.ts`.

#### The `action` function

This function is at the heart of the CLI. Any and every action performed by the commands are done inside this function. It is recommended to keep the `action` function as clean as possible and move the logic to other `private` functions if needed.

The action function accepts just a single argument with the type `CommandActionData`:

```typescript
export interface CommandActionData {
  options: Record<string, any>
  args: string[]
}
```

The arguments and options used by the command are passed to the `action` function. You can access them using `data.options` and `data.args`.

Consider this command: `ks profile update main --name "New Name"`. In this command, `main` is the argument and `--name "New Name"` is the option. You can access the argument using `data.args[0]` and the option using `data.options.name`. The code implementation will look something like this:

```typescript
// ... snip
public async action({ options, args }: CommandActionData): Promise<void> {
  const profileName = args[0]
  const { name } = options

  // Your logic here
}
// ... snip
```

#### Best practices

- Please ensure that you don't stash too much functionality inside the `action`. Use self-explanatory private function names and move the logic to those functions.
- We use `fetch` for making HTTP requests. Please ensure that you use the HTTP client from `src/http` to make requests.
- Whenever you are creating any HTTP request, please add the API request to the `src/http/<command>.ts` file. This will help in maintaining the codebase and will make it easier for others to understand the code.
