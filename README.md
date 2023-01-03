# Prompt Explorer

## Features

- Run GPT-3 prompts directly from RemNote.
- Turn prompts into commands using the `Prompt` powerup.
- Coming soon:
  - Allow custom prompts to take parameters.
  - Chain prompts into powerful workflows.
  - Cool UI experiments.

## How to Use

NOTE: It isn't free to use GPT-3. The exact cost depends on your usage. Please sign up for an [OpenAI API key](https://openai.com/api/) and paste it into the "API Key" settings box in the plugin settings page.

## Prompts

- Either the currently selected range of text or the currently focused Rem's text will be used as input.
- The output will get added as children of the focused Rem.

### Builtin Prompts

- Generate QA Flashcards command:

![Generate QA Flashcard](https://raw.githubusercontent.com/bjsi/prompt-explorer/main/img/generate-qa.gif)

- Generate CDF (Concept Descriptor Framework) Flashcards command:

![Generate CDF (Concept Descriptor Framework) Flashcards command](https://raw.githubusercontent.com/bjsi/prompt-explorer/main/img/generate-cdf.gif)

I made a change recently to make the prompts work for other languages. Let me know if you notice any cases where it doesn't work.

### Custom Prompts

- You can send any Rem's text to GPT-3 using the /Run Prompt command.
- Tag Rem with the `Prompt` powerup and add the `command name` powerup slot to register the prompt as a command.
- How to add the command name slot:

![Command Name Slot](https://raw.githubusercontent.com/bjsi/prompt-explorer/main/img/commandname.gif)

- Example:

![Custom Prompt Command](https://raw.githubusercontent.com/bjsi/prompt-explorer/main/img/custom-prompt-cmd.gif)


## Settings

### Global Settings

- You can set some global GPT-3 completion parameters in the plugin settings page (eg. model, temperature...)

### Prompt Settings

- For custom prompts tagged with the `Prompt` powerup, you can add powerup slots to override global completion parameters.

![Custom Prompt Command](https://raw.githubusercontent.com/bjsi/prompt-explorer/main/img/rem-params.png)

## Developers

The `main` branch is for stuff which is already released into the plugin available in the plugin marketplace. The `dev` branch contains some much cooler experimental features which will gradually make their way into the `main` branch.

If you are interested in building your own plugins, taking a look through the source code for this plugin (as well as the other example plugins and plugins built by the community) would be a great starting point. Of course, you should also check out the official documentation, guides and tutorials on our [plugin website](https://plugins.remnote.com/).
