# Running Coach Web

Web application and user portal for Running Coach.

## Overview

Running Coach connects with training data from Intervals.icu and helps turn it into a clearer weekly running plan.

This product is intended to be the main user-facing portal for the app. Over time, runners should be able to do the full core journey here: create an account, connect Intervals, complete goal setup and onboarding, review upcoming sessions, follow the weekly plan, and use the rest of the training experience from the same place.

This repository contains that web application layer, not the backend domain logic. The first release is still intentionally small and practical: explain the product clearly, provide a privacy policy, support OAuth review credibility, and establish a clean frontend foundation that can grow into the full user portal.

## Stack

- Astro
- TypeScript
- Plain CSS

## Design workflow

- product design source of truth: `design/running-coach.pen`
- reference kit: `design/pencil-lunaris.pen`
- design tokens: `src/styles/tokens.css`
- implementation: `src/`

Use Pencil first for new pages or meaningful layout changes. Implement only after the relevant mobile-first frame exists in `design/running-coach.pen`.

## Commands

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm run preview`

## Pages

- `/`
- `/privacy`
