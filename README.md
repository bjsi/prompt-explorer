# Prompt Explorer

## Features

- Run GPT-3 prompts directly from RemNote.
- Turn prompts into commands using the `Prompt` powerup.
- Coming soon:
  - Allow custom prompts to take parameters.
  - Chain prompts into powerful workflows.
  - Cool UI experiments.

## How to Use

NOTE: It isn't free to use GPT-3. The cost depends on your usage. Please sign up for an [API key](https://openai.com/api/) and paste it into the "API Key" settings box in the plugin settings page.

### Builtin Prompts

- Generate QA flashcards.
- Generate CDF (Concept Descriptor Framework) flashcards

### Custom Prompts

- You can send any Rem's text to GPT-3 using the /Run Prompt command.
- Tag Rem with the `Prompt` powerup and add the `command name` powerup slot to register the prompt as a command.
- TODO: images and gifs

## Developers

The `main` branch is for stuff which is already released into the plugin available in the plugin marketplace. The `dev` branch contains some much cooler experimental features which will gradually make their way into the `main` branch.

If you are interested in building your own plugins, taking a look through the source code for this plugin (as well as the other example plugins and plugins built by the community) would be a great starting point. Of course, you should also check out the official documentation, guides and tutorials on our [plugin website](https://plugins.remnote.com/).
