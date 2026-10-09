## Summary

<!-- What changed and why? -->

## Verification

<!-- Commands/tests run and outcomes. -->

## Visual evidence — required for screen/UI changes

Complete this checklist and embed evidence directly in this description **before
requesting review**, including after updates. If capture, upload or rendering is
blocked, explain the blocker and keep the PR in draft. See AGENTS.md for the
Playwright capture and GitHub CLI attachment workflow.

- [ ] Playwright captures of the running app cover each modified screen and
      materially changed UI state; no mockups or redundant unchanged states.
- [ ] Mobile and desktop captures are included when applicable; any omitted
      viewport is explained.
- [ ] Existing screens have labeled before/after captures with matching data,
      viewport and state; the baseline commit is identified, or its absence
      explained.
- [ ] Only the screenshots needed to explain the change are included; a short
      GIF is used only when it explains motion or an interaction better.
- [ ] Evidence is embedded below using GitHub-hosted attachments, labeled with
      route, viewport dimensions, UI state and before/after; no Git blob/raw links.
- [ ] Evidence files stay in temporary storage outside repositories/worktrees;
      no PR screenshots, GIFs or videos are committed.
- [ ] Attachments preserve the existing description and evidence; the final
      description has been checked for inline rendering and missing uploads.
- [ ] Captures use test or anonymized data and have been inspected: no personal
      information, credentials or tokens, including in URLs, browser chrome or
      developer tools.

For changes with no rendered UI impact, leave the visual evidence checklist
unchecked and write: `Not applicable — no screens changed`.

<!--
Embed inspected PNGs/GIFs with gh pr edit <this-pr-number> --attach <temp-file>.
Omit --body/--body-file when attaching: the existing body is preserved.
For placement/checklist edits, fetch and edit the latest complete body in a
temporary file, preserving all other content and uploaded asset URLs.
Label each embed or before/after table with route, viewport, state and baseline.
Record the non-UI exception or blocker here when applicable.
-->

