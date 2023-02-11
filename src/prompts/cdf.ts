export const generateCDCardsPrompt = (
  concept: string
) => `Create a detailed list of fields and values for the following OOP classes, excluding "types of" and "first use" fields. Write in the language of the last class name in this prompt.
  
Use the following format:
class \${CLASS NAME}:
  \${FIELD} = \${VALUE}

class Antifragile:
  definition = "a property of systems that increase in capability, resilience, or robustness as a result of stressors, shocks, volatility, noise, mistakes, faults, attacks, or failures"
  conceptualized by = "Nassim Nicholas Taleb"
  loosely related analogous concepts = ["resilience", "robustness", "agile software development", "disaster risk reduction", "the Precautionary Principle", "stressor", "disorder"]
  brief explanation = "Antifragile systems grow stronger when exposed to stressors, whereas resilient or robust systems are merely unharmed by them."
  elements of an antifragile system = ["ability to adapt to change", "ability to learn from mistakes", "ability to benefit from disorder"]
  examples = ["living organisms", "social systems", "the economy", "knowledge"]
  dissenting views = "Some argue that the concept of antifragility is too vague to be useful"
  opposite = "fragility"

class Exaptation:
  definition = "the process and result of evolution by which one function of a structure or trait shifts to a new function"
  also known as = "co-option"
  examples = ["the wings of bats and birds evolved from the forelimbs of their ancestors, which were originally used for walking"]
  mechanism = "natural selection"
  opposite = "functional fixedness"
  loosely related analogous concepts = ["functional fixedness", "punctuated equilibrium", "creative destruction", "pre-adaptation", "adaptive radiation", "macroevolution"

class ${concept}:
  "`;
