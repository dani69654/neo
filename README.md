```
 _   _ ______ ____
| \ | |  ____/ __ \
|  \| | |__ | |  | |
| . ` |  __|| |  | |
| |\  | |___| |__| |
|_| \_|______\____/
```

<p align="center"><strong>An AI entity that doesn't know anything by default — it learns skills at runtime, one at a time, and uses them on demand.</strong></p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white">
  <img alt="TensorFlow.js" src="https://img.shields.io/badge/TensorFlow.js-4-FF6F00?logo=tensorflow&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-ISC-blue">
</p>

---

## Table of contents

- [Concept](#concept)
- [Features](#features)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Using Neo](#using-neo)
- [Skills reference](#skills-reference)
- [Face recognition](#face-recognition)
- [Data & persistence](#data--persistence)
- [NPM scripts](#npm-scripts)
- [Roadmap](#roadmap)
- [License](#license)

## Concept

Neo is inspired by *The Matrix*: Jack-in and **"I know kung fu."** The character starts
knowing nothing, and abilities are uploaded into him on demand.

This project models that idea literally. The `Neo` class starts **empty** — no
default skills — and exposes exactly three operations:

```ts
neo.learn('double', useDouble);   // upload a new skill
neo.use('double', 21);            // → 42
neo.knows('double');              // → true
```

A skill is just a function. Some skills are rule-based (`clear`, `resources`,
`chitchat`); others are small neural networks trained with TensorFlow.js
(`add`, `double`, `isEven`, `recognizeFace`, …). Either way, from Neo's
perspective they're all the same shape: `learn` it once, `use` it forever.

On top of the raw `learn`/`use` API sits a natural-language layer: type plain
English at Neo and a small intent classifier (`language`) figures out what
you want, then a conversation orchestrator (`Chat`) either makes small talk
or calls the right skill for you.

## Features

- 🧠 **Runtime learning** — skills don't exist until you `train`/`learn` them; nothing is hardcoded upfront.
- 💬 **Natural language interface** — a bag-of-words intent classifier turns free text like `"what's 20 mod 3?"` into a skill call.
- ➕ **ML-based arithmetic** — `add`, `subtract`, `multiply`, `divide`, `mod`, `double` and `isEven` are all learned by small neural nets, not hardcoded formulas, including chained expressions like `2 * 9 / 3`.
- 🙂 **Face recognition** — pretrained face detection + a 128-value face descriptor (dlib's ResNet-34, ~99.4% on LFW) to recognize people from photos, with honest "I don't recognize this face" rejection for strangers.
- 💾 **Persistence** — every trained skill is saved to disk and silently restored on the next run; no need to retrain every session.
- 🖥️ **Simple CLI** — a REPL with both a free-form chat mode and explicit admin commands (`train`, `use`, `knows`, `stats`, …).

## Architecture

```
                 ┌────────────────────┐
   free text ──▶ │   language (NLU)   │  bag-of-words intent classifier
                 └─────────┬──────────┘
                           │ { intent, numbers, imagePath, ... }
                           ▼
                 ┌────────────────────┐
                 │        Chat        │  orchestrator — decides what to do
                 └─────────┬──────────┘
                     ┌─────┴─────┐
                     ▼           ▼
              ┌────────────┐ ┌─────────┐
              │  chitchat  │ │   Neo   │  learn/use registry
              └────────────┘ └────┬────┘
                                  │ neo.use(name, ...args)
                     ┌────────────┼─────────────┐
                     ▼            ▼             ▼
                 add/mod/…   recognizeFace   double/isEven
                 (TF.js)     (face-api.js)     (TF.js)
```

- **`Neo`** (`src/core/Neo.ts`) knows nothing about skill internals. It's a
  plain name → function registry with `learn`, `use`, `knows`.
- **`language`** (`src/skills/language`) classifies free text into an
  `Intent` (`add`, `recognizeFace`, `greet`, …), pulling out numbers or an
  image path as needed. Structured commands (math expressions, face-lookup
  phrasing) are detected with dedicated parsers *before* falling back to the
  trained classifier, so `"who is this photo.jpg"` never gets mis-classified
  as small talk.
- **`Chat`** (`src/core/Chat.ts`) never talks to TensorFlow directly — it asks
  `Neo` to run a skill and formats the result. It's the only place that knows
  how to turn a skill's raw output into a sentence.
- **Skills** each live in their own folder under `src/skills/<name>/` with a
  consistent shape: `train<Name>()`, `use<Name>()`, `load<Name>Model()` /
  `save<Name>Model()`. ML skills are trained once and persisted; rule-based
  skills (`clear`, `resources`, `chitchat`) need no training at all.
- **`skillBootstrap` / `skillPersistence`** (`src/core`) glue it together:
  they train-on-demand the first time a skill is needed, and save/restore
  weights across process restarts.

## Project structure

```
src/
├─ core/
│  ├─ Neo.ts                 # the Neo class: learn / use / knows
│  ├─ Chat.ts                # conversation orchestrator
│  ├─ chainEvaluator.ts      # evaluates multi-op math chains (2*9/3) via skills
│  ├─ adminCommands.ts       # CLI verb/skill synonym resolution
│  ├─ skillBootstrap.ts      # train-on-demand + register
│  ├─ skillPersistence.ts    # save/load all skills, train-all
│  ├─ skillResult.ts         # { result, confidence } shape used by every skill
│  ├─ modelStore.ts          # disk I/O for TF.js models + JSON side-files
│  ├─ neoState.ts            # data/neo-state.json (what's trained, when)
│  └─ paths.ts               # data/ layout constants
├─ skills/
│  ├─ add/ subtract/ multiply/ divide/ mod/   # binary arithmetic (TF.js)
│  ├─ double/ isEven/                         # unary arithmetic (TF.js)
│  ├─ recognizeFace/                          # face detection + recognition
│  ├─ language/                               # intent classifier + parsers
│  ├─ chitchat/                               # canned conversational replies
│  ├─ clear/ resources/                       # rule-based utility skills
│  └─ <skill>/<skill>Testdata.ts              # training data generator per skill
├─ scripts/
│  └─ trainAll.ts            # `npm run train-all`
├─ utils/
│  └─ createRng.ts           # seeded PRNG shared by training data generators
└─ index.ts                  # interactive CLI entry point
```

## Getting started

### Prerequisites

- Node.js 18–22 (`@tensorflow/tfjs-node` and the face recognition model do
  not support Node 23+)
- npm

### Install

```bash
git clone <this-repo>
cd neo
npm install
```

### Build & run

```bash
npm run build   # compiles TypeScript to dist/
npm start       # runs the compiled CLI

# or, in one step during development:
npm run dev
```

You'll land in an interactive prompt:

```
Neo — type "help" for admin commands, or just talk to me. Type "exit" to quit.
neo>
```

## Using Neo

Neo understands two kinds of input on the same prompt: **free-form chat**
and **admin commands**.

### Chat (natural language)

```
neo> hi
Hi there! What can I do for you? (confidence: 100.0%)

neo> double 21
The double of 21 is 41.99997329711914 (confidence: 100.0%).

neo> is 17 even?
17 is odd (confidence: 98.3%).

neo> add 5 and 3
5 + 3 = 8 (confidence: 100.0%).

neo> 2 * 9 / 3
2 * 9 / 3 = 6 (confidence: 100.0%).

neo> 20 mod 3
20 mod 3 = 2 (confidence: 100.0%).

neo> who is this data/faces/ada/01.jpg
That's ada (confidence: 97.2%).
```

Skills are **trained automatically the first time they're needed** — the
first message that requires `add`, for instance, triggers training and then
answers. Every later run restores the trained weights from disk instantly.

### Admin commands

`train`/`learn`/`teach`, `use`/`run`/`invoke`, and `knows`/`has` are
interchangeable, and skill names have friendly aliases (`sum` → `add`,
`face` → `recognizeFace`, `parity` → `isEven`, …).

| Command | Description |
|---|---|
| `help` | Show available commands and example messages |
| `train <skill>` | Explicitly (re-)train a skill and persist it to disk |
| `use <skill> <args>` | Call a skill directly, bypassing natural language |
| `knows <skill>` | Check whether Neo currently knows a skill |
| `stats` | Show Neo's own process resource usage (memory, CPU, uptime) |
| `clear` | Clear the terminal |
| `exit` | Quit |

```
neo> train recognizeFace
neo> use add 12 30
neo> knows double
neo> stats
```

## Skills reference

| Skill | Type | What it does |
|---|---|---|
| `add`, `subtract`, `multiply`, `divide`, `mod` | ML (TF.js) | Binary arithmetic learned from generated examples, not hardcoded operators |
| `double` | ML (TF.js) | Doubles a number |
| `isEven` | ML (TF.js) | Classifies a number as even/odd from its binary encoding |
| `recognizeFace` | ML (pretrained) | Detects a face in a photo and matches it against known people |
| `language` | ML (TF.js, bag-of-words) | Classifies free text into an intent + extracts arguments |
| `chitchat` | Rule-based | Canned replies for small talk (greetings, thanks, help, …) |
| `clear` | Rule-based | Clears the terminal |
| `resources` | Rule-based | Reports memory/CPU/uptime |

Every skill returns a `{ result, confidence }` pair (see
`src/core/skillResult.ts`), so the CLI can always show how sure Neo is,
whether that confidence came from a softmax output or is simply `1` for a
deterministic rule-based skill.

## Face recognition

`recognizeFace` is intentionally **not** a classifier trained from scratch on
your photos — with only a handful of pictures per person, a small CNN can't
learn to reliably reject strangers (it will confidently guess the closest
class it has ever seen). Instead it uses **transfer learning at inference
time**:

1. **Detection** — [`@vladmandic/face-api`](https://github.com/vladmandic/face-api)'s
   SSD Mobilenet v1 locates the actual face in the photo (no manual cropping).
2. **Description** — a pretrained ResNet-34-like network (dlib's face
   recognition model, ~99.4% accuracy on LFW) turns the aligned face into a
   128-value descriptor. This network was trained to separate *any* two
   faces, not just the people in your training set — which is exactly what
   makes rejecting unknown people possible.
3. **Matching** — "training" Neo on your photos just means computing and
   storing a descriptor per photo. Recognizing a new photo means computing
   its descriptor and finding the closest known one by Euclidean distance;
   below a threshold it's a match, above it Neo says it doesn't know the
   person.

### Adding people

Drop a few normal-sized photos (JPEG/PNG/WebP) per person into
`data/faces/<name>/`, then train:

```
neo> train recognizeFace
```

```
data/faces/
├─ ada/
│  ├─ 01.jpg
│  └─ 02.jpg
└─ grace/
   └─ 01.jpg
```

Re-run `train recognizeFace` any time you add or remove photos — Neo doesn't
watch the folder automatically.

### Asking

```
neo> who is this /path/to/photo.jpg
neo> who is in data/faces/ada/01.jpg
neo> identify /path/to/photo.jpg
```

Replies come in three flavors:

- **`That's <name> (confidence: 97.2%).`** — confident match.
- **`I'm not sure — maybe <name> (confidence: 40.0%).`** — a match, but close
  to the decision boundary.
- **`I don't recognize this face — it doesn't match anyone I was trained
  on (confidence: 0.0%). Add photos under data/faces/<name>/ and run "train
  recognizeFace".`** — the face is far from every known person.

Very small, blurry, or heavily cropped photos (or photos with no detectable
face at all) are skipped during training, with a summary logged to the
console.

## Data & persistence

Everything Neo learns lives under `data/` (gitignored, generated locally):

```
data/
├─ neo-state.json     # which skills are trained, and when
├─ models/<skill>/    # TF.js model.json/weights.bin + JSON side-files
└─ faces/<name>/      # your photos for recognizeFace (never committed)
```

Nothing under `data/` needs to be checked into version control — everything
there is either generated by training or personal photo data.

## NPM scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled CLI (`dist/index.js`) |
| `npm run dev` | Build and run in one step |
| `npm run train-all [isEvenBits]` | Train and persist every ML skill at once |

## Roadmap

- [ ] Persist learned skills more richly (versioning, metadata)
- [ ] `neo.listSkills()` — introspect everything Neo currently knows
- [ ] More ML-based skills beyond arithmetic and vision
- [ ] Richer conversational memory across turns

## License

ISC — see [`package.json`](./package.json).
